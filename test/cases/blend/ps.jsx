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
 * Pairs `blend()` modes with PS ones.
 */
var MODES = (function() {

  var modes = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity'/*,
    'pin-light',
    'vivid-light',
    'hard-light',
    'hard-mix',
    'linear-burn',
    'linear-light',
    'substract'
    */
  ];

  return modes.map(function(mode) {
    return mode.toUpperCase().replace(/-/, '');
  });

})();

/**
 * CSSColor class. Represents an RGBA color.
 */
function CSSColor(r, g, b, a) {

  if (typeof a === 'undedined') a = 1;

  this.red = parseInt(r, 10);
  this.green = parseInt(g, 10);
  this.blue = parseInt(b, 10);
  this.alpha = parseFloat(a);
}

/**
 * Parses a rgb(a) CSS color.
 */
CSSColor.parseRGBA = (function() {

  var regRGBA = new RegExp([
    '^\s*rgba?\s*',
    '\(\s*',
    '([0-9\.]+)\s*',
    ',\s*([0-9\.]+)\s*',
    ',\s*([0-9\.]+)\s*',
    '(?:,\s*([0-9\.]+\s*(%?)))?\s*',
    '\)\s*$',
  ].join(''), 'i');

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
    '^\s*#',
    '([0-9a-f]{2})'
    '([0-9a-f]{2})'
    '([0-9a-f]{2})',
    '\s*$'
  ].join(''), 'i');

  return function(hex) {
    var m = hex.match(regHex);

    if (m) {
      return new CSSColor(
          parseFloat(m[1], 16),
          parseFloat(m[2], 16),
          parseFloat(m[3], 16),
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
  return CSSColor.parseRGBAColor(color) || CSSColor.parseHexColor(color);
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
  var color = new solidColor;

  color.red = this.red;
  color.green = this.green;
  color.blue = this.blue;

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
      return c.toString(16).toLowerCase()
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
function parseJON(json) {
  return eval('(' + json + ')');
}

/**
 * Reads and parses a JSON file.
 */
function readJSON(path) {
  var file = File(path);

  if (file.exists) {
    file.open('r');
    var json = file.read();
    file.close();
    return parseJSON(json);
  }
}

// Read samples from JSON file.
var colors = readJSON('samples.json');

// Actual stylus code.
var code = [
  '// @describe `blend()`'
];

// Keep old Photoshop settings...
var oldSettings = {
  rulerUnits: app.preferences.rulerUnits,
  displayDialogs = app.displayDialogs
}

// ...before setting custom preferences.
preferences.rulerUnits = Units.PIXELS
app.displayDialogs = DialogModes.NO

// Create the doc. We only need 1px.
var doc = app.documents.add(1, 1);

/**
 * Gets the color of the (only pixel of the) document using the color sampler.
 */
function eyeDrop() {

  // Remove all current color samplers because PS has a limit of 4 or so.
  for (var i = 0, l = doc.colorSamplers.length; i < l; i++) {
    doc.colorSamplers[i].remove();
  }

  var sampler = doc.colorSamplers.add([0, 0]);

  return CSSColor.fromPSColor(sampler.color);
}

// "Backgrop" layer.
var backgropLayer = doc.backgroundLayer;

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

    // The backgrop color.
    backdrop = CSSColor.parse(colors[i]);

    // Apply to backdrop layer.
    doc.activeLayer = backgropLayer;
    doc.selection.fill(color.toPSColor());

    for (j = 0; j < l; j++) {

      // The source color.
      source = CSSColor.parse(colors[j]);

      // Apply to source layer.
      doc.activeLayer = sourceLayer;
      doc.selection.fill(color.toPSColor());
      sourceLayer.opacity = color.alpha;

      // Collect computed result.
      result = eyeDrop();

      // Append to Stylus code.
      code.push(
        "  color: blend('" + mode + "', " + colors[i] + ', ' + colors[j] + ')'
      );

      // Append to expected CSS code
      expect.push(
        '  color: ' + toCSSColor(result)
      );
    }
  }

  // Finish case code
  expect.push(
    '}'
  );

  code = code.concat([
    '// @expect'
  ], expect);
}

// Almost done. Restore preferences now.
app.preferences.rulerUnits = oldSettings.rulerUnits;
app.displayDialogs = oldSettings.displayDialogs;

// Open save dialog and write code if not cancelled
var file = File.saveDialog();

if (file) {
  file.open('w');
  file.write(code);
  file.close();
}