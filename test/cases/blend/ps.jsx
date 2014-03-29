/**
 * This PS script automatically creates the test cases for `blend()` based on
 * *actual Photoshop results*. It:
 *
 * - Creates a new 1x1 RGB document in PS.
 * - Adds a new layer.
 * - Reads a list of colors defined in `samples.json`.
 * - Fills the layer (`source`) and background (`backdrop`) with combinations of
 *   the samples, sets the source layer opacity to the same value as the source
 *   color alpha and gets the computed color using the color sampler.
 * - Composes a `.styl` test case based on the sample colors and the collected
 *   results.
 * - Opens a dialog asking where to save the `.styl` file to.
 *
 * This is regular JavaScript, despite the `.jsx` extension. Tested on Photoshop
 * CS 6 & Windows 7.
 */

/**
 * `Array.prototype.map` polyfill.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 */
if (!Array.prototype.map) {

  Array.prototype.map = function(fun /*, thisArg */) {

    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = new Array(len);
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      // NOTE: Absolute correctness would demand Object.defineProperty
      //       be used.  But this method is fairly new, and failure is
      //       possible only if Object.prototype or Array.prototype
      //       has a property |i| (very unlikely), so use a less-correct
      //       but more portable alternative.
      if (i in t)
        res[i] = fun.call(thisArg, t[i], i, t);
    }

    return res;
  };
}

/**
 * This tells the path of this script.
 *
 * From http://www.ps-scripts.com/bb/viewtopic.php?f=2&t=3446
 */
function whereAmI() {

  var where;

  try {
    var forcedError = FORCEDRRROR;
  } catch (e) {
    where = File(e.fileName).parent;
  }

  return where;
}

/**
 * Pairs `blend()` modes with PS ones.
 */
var MODES = {
  'normal':      BlendMode.NORMAL,
  'multiply':    BlendMode.MULTIPLY,
  'screen':      BlendMode.SCREEN,
  'overlay':     BlendMode.OVERLAY,
  'darken':      BlendMode.DARKEN,
  'lighten':     BlendMode.LIGHTEN,
  'color-dodge': BlendMode.COLORDODGE,
  'color-burn':  BlendMode.COLORBURN,
  'hard-light':  BlendMode.HARDLIGHT,
  'soft-light':  BlendMode.SOFTLIGHT,
  'difference':  BlendMode.DIFFERENCE,
  'exclusion':   BlendMode.EXCLUSION,
  'hue':         BlendMode.HUE,
  'saturation':  BlendMode.SATURATION,
  'color':       BlendMode.COLORBLEND,
  'luminosity':  BlendMode.LUMINOSITY
};

/**
 * CSSColor class. Represents an RGBA color.
 */
function CSSColor(r, g, b, a) {

  if (typeof a === 'undedined') a = 1;

  this.red = Math.round(parseFloat(r));
  this.green = Math.round(parseFloat(g));
  this.blue = Math.round(parseFloat(b));
  this.alpha = Math.round(parseFloat(a));
}

/**
 * Parses a rgb(a) CSS color.
 */
CSSColor.parseRGBA = (function() {

  var regRGBA = /^\s*rgba?\s*\(\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*(?:,\s*([0-9\.]+\s*(%?)))?\s*\)\s*$/i;

  return function(rgba) {
    var m = rgba.match(regRGBA)

    if (m) {

      var alpha = 1;

      if (m.length > 4) {
        alpha = parseFloat(m[4]);
        if (m[5] === '%') {
          alpha /= 100;
        }
      }

      return new CSSColor(m[1], m[2], m[3], alpha);
    }
  }

})();

/**
 * Parses an hexadecimal CSS color.
 */
CSSColor.parseHex = (function() {

  var regHex = new RegExp([
    '^\\s*#',
    '([0-9a-f]{2})',
    '([0-9a-f]{2})',
    '([0-9a-f]{2})',
    '\\s*$'
  ].join(''), 'i');

  return function(hex) {
    var m = hex.match(regHex);

    if (m) {
      return new CSSColor(
          parseInt(m[1], 16),
          parseInt(m[2], 16),
          parseInt(m[3], 16),
          1
      );
    }

    return null;
  }

})()

/**
 * Parses a rgb(a) or hexadecimal CSS color.
 */
CSSColor.parse = function(color) {
  return CSSColor.parseRGBA(color) || CSSColor.parseHex(color);
}

/**
 * Creates a new `CSSColor` from a PS `solidColor` and an optional `alpha`
 * value.
 */
CSSColor.fromPSColor = function(color, alpha) {
  if (typeof alpha === 'undefined') alpha = 1;

  return new CSSColor(
    color.rgb.red,
    color.rgb.green,
    color.rgb.blue,
    1
  );
}

/**
 * Returns equivalent (opaque) PS `solidColor`.
 */
CSSColor.prototype.toPSColor = function() {
  var color = new SolidColor;

  color.rgb.red = this.red;
  color.rgb.green = this.green;
  color.rgb.blue = this.blue;

  return color;
}

CSSColor.prototype.toString = function() {
  if (this.alpha < 1) {
    return 'rgba(' +
      this.red +
      ', ' + this.green +
      ', ' + this.blue +
      ', ' + this.alpha +
    ')';
  }

  var hex = [this.red, this.green, this.blue].map(
    function(c) {
      return ('0' + c.toString(16).toLowerCase()).substr(-2);
    }
  );

  for (var i = 0; i < 3; i++) {
    if (hex[i].charAt(0) !== hex[i].charAt(1)) {
      // Long #XXXXXX form
      return '#' + hex[0] + hex[1] + hex[2];
    }
  }

  // Abbreviated #XXX form
  return '#' + hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
}

/**
 * Parses a JSON string.
 */
function parseJSON(json) {
  return eval('(' + json + ')');
}

/**
 * Reads and parses a JSON file.
 */
function readJSON(path) {
  var file = File(whereAmI() + path);

  if (file.exists) {
    file.open('r');
    var json = file.read();
    file.close();
    return parseJSON(json);
  }
}

// Read samples from JSON file.
var colors = readJSON('./samples.json');

// Actual stylus code.
var code = [
  '// @describe `blend()`'
];

// Keep old Photoshop settings...
var oldSettings = {
  rulerUnits: app.preferences.rulerUnits,
  displayDialogs: app.displayDialogs
}

// ...before setting custom preferences.
preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;

// Create the doc. We only need 1px.
var doc = app.documents.add(1, 1);
doc.bitsPerChannel = BitsPerChannelType.SIXTEEN;

// Add a color sampler to query result color
var sampler = doc.colorSamplers.add([0, 0]);

// "Backdrop" layer.
var backdropLayer = doc.backgroundLayer;

// Create the "source" layer.
var sourceLayer = doc.artLayers.add();

// Select the *whole* pixel.
doc.selection.selectAll();

// Blend each color with each other.
var mode, i, j, l = colors.length, source, result, expect;

for (mode in MODES) {

  // This is the Stylus part of the case.
  code.push(
    '// @it `' + mode + '`',
    'body'
  );

  // This is the CSS part of the case after `@expect`.
  expect = [
    'body {'
  ];

  sourceLayer.blendMode = MODES[mode];

  for (i = 0; i < l; i++) {

    // The backdrop color.
    backdrop = CSSColor.parse(colors[i]);

    // Apply to backdrop layer.
    doc.activeLayer = backdropLayer;
    doc.selection.fill(backdrop.toPSColor());

    for (j = 0; j < l; j++) {

      // The source color.
      source = CSSColor.parse(colors[j]);

      // Apply to source layer.
      doc.activeLayer = sourceLayer;
      doc.selection.fill(source.toPSColor());
      sourceLayer.opacity = source.alpha * 100;

      // Collect computed result.
      result = CSSColor.fromPSColor(sampler.color);

      $.writeln(mode + ': ' , source, ' + ', backdrop, ' = ', result);

      // Append to Stylus code.
      code.push(
        "  color: blend('" + mode + "', " + colors[j] + ', ' + colors[i] + ')'
      );

      // Append to expected CSS code
      expect.push(
        '  color: ' + result + ';'
      );
    }
  }

  // Finish case code
  expect.push(
    '}'
  );

  code = code.concat([
    '',
    '// @expect',
    ''
  ], expect);
}

// Almost done. Restore preferences now.
app.preferences.rulerUnits = oldSettings.rulerUnits;
app.displayDialogs = oldSettings.displayDialogs;

// And silently close document.
doc.close(SaveOptions.DONOTSAVECHANGES);

// Open save dialog and write code if not cancelled
var file = File.saveDialog('Save test case', "Stylus:*.styl");

if (file) {
  code = code.join("\n");
  file.open('w');
  file.write(code);
  file.close();
}
