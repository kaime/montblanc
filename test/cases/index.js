var stylus = require('stylus'),
    montblanc = require('../../'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob');


var readFile = function(file) {
 return fs.readFileSync(file, 'utf8').replace(/\r/g, '');
}

var tests = glob.sync('test/cases/*.styl');

describe('Test cases', function() {

  tests.forEach(function(file) {

    var name = path.basename(file, '.styl');

    it(name, function() {

      var styl = readFile(file, 'utf8'),
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