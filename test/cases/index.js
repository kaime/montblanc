var stylus = require('stylus'),
    montblanc = require('../../'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob');

var readFile = function(file) {
 return fs.readFileSync(file, 'utf8').replace(/\r/g, '');
}

var getDirective = function(str) {
  if ('//' === str.trim().substr(0, 2)) {
    var comment = str.substr(2).trim();
    if ('@' === comment.substr(0, 1)) {
      var w = comment.indexOf(' ');

      if (w > 0) {
        return comment.substr(1, w).trim()
      } else {
        return comment.substr(1);
      }

    }
  }
  return false;
}

var getDirectiveComment = function(str) {
  if ('//' === str.trim().substr(0, 2)) {
    var comment = str.substr(2).trim();
    if ('@' === comment.substr(0, 1)) {
      var w = comment.indexOf(' ', 1);
      if (w > 0) {
        return comment.substr(w).trim();
      }
    }
  }
  return '';
}

describe('Cases', function() {

  var reset = [];

  // Reset all `support-to-*` vars on every case to avoid prefixes here.
  reset.push(
    'support-none()'
  )

  reset = reset.join("\n")

  var tests = glob.sync('test/cases/*.styl');

  tests.forEach(function(file) {

    var name = '',
        expected = null,
        them = [];

    var lines = readFile(file).split(/\r?\n/);

    for (var line, dir, i = 0, l = lines.length; i < l; i++) {

      line = lines[i].trim();

      if (line === '') continue;

      if (false !== (dir = getDirective(line))) {
        if ('describe' === dir) {
          name = getDirectiveComment(line);
          i++;
        }
      }
      break;
    }

    if ('' === name) {
      name = path.basename(file, '.styl');
    }

    for (; i < l; i++) {

      line = lines[i];

      if (line === '') continue;

      if (false !== (dir = getDirective(line))) {

        if ('it' === dir) {

          var desc = getDirectiveComment(line);
              styl = [],
              expected = [];

          i++;

          while (i < l) {

            line = lines[i];

            if (false !== (dir = getDirective(line))) {

              if ('expect' === dir) {

                ++i;

                while (i <= l) {

                  if (i === l || (false !== getDirective(lines[i]))) {

                    if (expected.length <= 0 || styl.length <= 0) {
                      throw "Empty case :(";
                    }

                    them.push([desc, function() {
                      var styl = reset + "\n" + this.styl,
                          expected = this.expected;

                      var style = stylus(styl)
                          .use(montblanc())
                          .set('filename', this.file);

                      style.render(function(err, actual){
                        if (err) {
                          throw err;
                        }
                        actual.trim().should.equal(expected.trim());
                      });

                    }.bind({
                      expected: expected.join("\n"),
                      styl: styl.join("\n"),
                      file: file
                    })]);
                    i--;
                    break;

                  } else {
                    expected.push(lines[i]);
                  }

                  i++;
                }

              } else {
                i--;
                break;
              }

            } else {
              styl.push(line);
            }

            i++;
          }

        } else {
          throw ":( @ " + file;
        }
      } else {
        throw ":(";
      }
    }

    if (them.length < 1) {
      throw "No cases found in file " + file;
    }

    describe(name, function() {
      them.forEach(function(one) {
        it(one[0], one[1]);
      });
    })

  });
})