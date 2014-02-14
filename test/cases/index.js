var stylus = require('stylus'),
    montblanc = require('../../'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    browsers = require('../../src/support/browsers.json');


var readFile = function(file) {
 return fs.readFileSync(file, 'utf8').replace(/\r/g, '');
}

describe('Cases', function() {

  // Reset all `support-to-*` vars on every case to avoid prefixes here.
  var reset = [];

  for (var browser in browsers) {
    reset.push(
      'support-for-' + browser + ' = no-support'
    );
  }

  reset = reset.join("\n")

  var tests = glob.sync('test/cases/*.styl');

  tests.forEach(function(file) {

    var name = path.basename(file, '.styl');

    it(name, function() {

      var styl = reset + "\n" + readFile(file, 'utf8'),
          css = readFile(path.join(path.dirname(file), name + '.css')).trim();

      var style = stylus(styl)
          .use(montblanc())
          .set('filename', file);

      style.render(function(err, actual){
        if (err) {
          throw err;
        }
        actual.trim().should.equal(css);
      });
    })
  });
})