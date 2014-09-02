var stylus = require('stylus'),
    montblanc = require('../../'),
    features = require('./features.json'),
    browsers = require('./browsers'),
    getBrowser  = require('./getBrowser');

describe("The `browsers.json` file", function() {

  describe("contains all caniuse versions of", function() {

    var caniuse = {
      // This is a montblanc => caniuse-name lookup table
      vendors: require('./vendors.json'),
      // This is the full caniuse browser support and usage data
      data: require('./data/data.json')
    };


    caniuse.data.should.have.property('agents');
    caniuse.data.agents.should.be.an.Object;

    function getVersions(versions) {

      var ret = [];

      versions.should.be.an.Array;

      for (var i = 0, l = versions.length; i < l; i++) {

        if (versions[i] === null) {
          // Ignore nulls. I think they're only there to align caniuse.com tables
          continue;
        }

        versions[i].should.be.an.String;

        // Some caniuse versions are actually version ranges: "opera 9.5-9.6"
        versions[i].split('-').forEach(function(v) {

          if (v === '0') {
            // Ignore '0' *for now*. @todo
            return;
          }

          v.should.match(/^[0-9]+(\.[0-9]+){0,2}$/);
          ret.push(v);

        });
      }

      ret.sort(function(a, b) {
        return parseFloat(b) - parseFloat(a);
      });

      return ret;
    }

    // Iterate over all caniuse vendors and versions and check they we know
    // them all
    //
    // @todo Until it makes sense, also test we don't have more vendors or
    // versions than caniuse has
    for (var vendor in caniuse.data.agents) {

      caniuse.data.agents[vendor].should.have.property('versions');

      var versions = getVersions(caniuse.data.agents[vendor].versions);

      var its = [];

      versions.forEach(function(version) {

        var browser = getBrowser(vendor, version);

        its[browser.id] = its[browser.id] || [];
        its[browser.id].push(version);

      });

      var browser;

      for (var b in its) {

        browser = browsers[b];

        it(browser.name, function(browser, vers) {
          vers.forEach(function(version) {
            browser.versions.should.have.property(version);
          });
        }.bind(this, browser, its[b]));

      }
    }

  });
});

describe("According to caniuse browser data,", function() {

  var getStats       = require('./getStats'),
      versionInRange = require('./versionInRange'),
      formatRange    = require('./formatRange');

  var values = [
        'bar',
        'foo baz("bar") !important'
      ];

  var ft, group;

  for (group in features) {

    var stats = getStats(group);

    stats.should.not.be.empty;

    for (var feature in features[group]) {

      ft = features[group][feature];

      if (ft.type !== 'property') continue;

      describe('the property `' + ft.name + '` ', function() {

        stats.forEach(function(st) {

          if (!st.supported) return;

          var browser = st.browser;

          it((st.prefix ? 'needs' : 'does not need') + ' to be prefixed' + (st.prefix ? ' with "' + st.prefix  + '"' : '') + ' on ' + browser.name + ' ' + formatRange(st.versions), function() {

            var ft = this.ft,
                group = this.group;

            var styl = [],
                expected = [];

            browser._versions.forEach(function(version) {

              if (versionInRange(version, st.versions)) {


                var c = "/* " + browser.name + ' ' + version + '*/';

                styl.push(
                  c,
                  "support-none()",
                  "support('" + st.browser.id + ' ' + version + "')"
                );

                expected.push(c);

                values.forEach(function(value) {
                  styl.push(
                    'div',
                    '  ' + ft.name + ': ' + value
                  );

                  expected.push(
                    'div {'
                  );

                  if (st.prefix) {
                    expected.push(
                      '  ' + st.prefix + ft.name + ': ' + value + ';'
                    );
                  }

                  expected.push(
                    '  ' + ft.name + ': ' + value + ';',
                    '}'
                  );
                });
              }
            });

            styl = styl.join("\n");
            expected = expected.join("\n");

            if (false && st.browser.id === 'opera-mobile') {
              console.log(styl, expected);
              console.log(st);
            }

            stylus(styl)
              .use(montblanc())
              .set('filename', ft.name + '.styl')
              .render(function(err, css) {
                if (err) {
                  throw err;
                }
                css.trim().should.equal(expected);
              });
          }.bind({
            ft: ft,
            group: group
          }));
        });

      });
    }
  }
});