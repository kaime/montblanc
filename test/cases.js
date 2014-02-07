var stylus = require('stylus'),
    montblanc = require('../'),
    fs = require('fs');

var cases = fs.readdirSync('test/cases').filter(function(file){
  return ~file.indexOf('.styl');
}).map(function(file){
  return file.replace('.styl', '');
});

describe('test', function(){
  cases.forEach(function(test){
    var name = test.replace(/[-.]/g, ' ');
    it(name, function(){
      var path = 'test/cases/' + test + '.styl';
      var styl = fs.readFileSync(path, 'utf8').replace(/\r/g, '');
      var css = fs.readFileSync('test/cases/' + test + '.css', 'utf8').replace(/\r/g, '').trim();

      var style = stylus(styl)
          .use(montblanc())
          .set('filename', path);

      style.render(function(err, actual){
        if (err) throw err;
        actual.trim().should.equal(css);
      });
    })
  });
})