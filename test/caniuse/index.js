var stylus = require('stylus'),
    montblanc = require('../../'),
    caniuse = {
      // This is a caniuse-name => montblanc-name lookup table
      vendors: require('./vendors.json'),
      // This is the full caniuse browser support and usage data
      data: require('./data/data.json')
    },
    features = require('./features.json'),
    browsers = require('../../src/support/browsers.json');

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

      v.should.match(/^[0-9]+(\.[0-9]+)?$/);
      ret.push(v);

    });
  }

  ret.sort(function(a, b) {
    return parseFloat(b) - parseFloat(a);
  });

  return ret;
}

describe("Our `browsers.json` file", function() {

  it("should include all caniuse vendors and versions", function() {

    caniuse.data.should.have.property('agents');
    caniuse.data.agents.should.be.an.Object;

    // Iterate over all caniuse vendors and versions and check they we know
    // them all
    for (var vendor in caniuse.vendors) {

      // Make sure our lookup table is up to date
      caniuse.vendors.should.have.property(vendor);

      browsers.should.have.property(caniuse.vendors[vendor]);

      // @todo Until it makes sense, also test we don't have more vendors or
      // versions than caniuse has

      caniuse.data.agents.should.have.property(vendor);
      caniuse.data.agents[vendor].should.have.property('versions');
      caniuse.data.agents[vendor].versions.should.be.an.Array;

      var versions = getVersions(caniuse.data.agents[vendor].versions);

      versions.forEach(function(version) {
        browsers[caniuse.vendors[vendor]].versions.should.have.property(version);
      });
    }

  });

});

describe("According to caniuse browser support data", function() {

  caniuse.data.should.have.property('data');
  caniuse.data['data'].should.be.an.Object;

  caniuse.features = caniuse.data['data'];

  for (var feature in caniuse.features) {

    caniuse.features[feature].should.have.property('stats');
    caniuse.features[feature].stats.should.be.an.Object;

    // @todo check we know all caniuse properties
    if (feature in features) {

      features[feature].should.be.an.Array;

      var stats = caniuse.features[feature].stats;

      for (var vendor in stats) {

        stats[vendor].should.be.an.Object;

        for (var vers in stats[vendor]) {

          var supported = false,
              prefix = false,
              partial = false;

          var p = stats[vendor][vers].split(' ');

          p.should.not.be.empty;

          switch (p[0]) {
            case 'y': // Supported
              supported = true;
              break;

            case 'n': // Not supported at all
            case 'p': // Not supported - polyfill available @todo
              supported = false;
              break;

            case 'a': // Partial support @todo warnings
              supported = true;
              partial = true;
              break;

            default:
              throw "Unexpected status!"
          }

          if (p.length > 1) {
            p[1].should.equal('x');
            caniuse.data.agents[vendor].should.have.property('prefix');
            var prefix = caniuse.data.agents[vendor].prefix;
            if ('prefix_exceptions' in caniuse.data.agents[vendor]) {
              if (vers in caniuse.data.agents[vendor]['prefix_exceptions']) {
                prefix = caniuse.data.agents[vendor]['prefix_exceptions'][vers];
              }
            }
            prefix = '-' + prefix + '-';
          }

          var versions = getVersions([vers]);

          // versions.should.not.be.empty; @todo Check this

          versions.forEach(function(version) {

            features[feature].forEach(function(node) {

              node.should.be.an.Object;
              node.should.have.property('type');

              ['property'].should.containEql(node.type);

              switch (node.type) {

                case 'property':
                  node.should.have.property('name');

                  if (prefix) {

                    it('the property `' + node.name + '` should be prefixed with "' + prefix + '" on ' + browsers[caniuse.vendors[vendor]].name + ' ' + version, function() {

                      var prefix = this.prefix,
                          vendor = this.vendor;

                      var styl = [];

                      for (var uv in caniuse.vendors) {
                        var support =
                          (uv != vendor)
                            ? 'no-support' // Disable support or other vendors
                            : version;

                        styl.push(
                          'support-for-' + caniuse.vendors[uv] + ' = ' + support
                        );
                      }

                      styl.push(
                        'div',
                        '  ' + node.name + ': foo'
                      );

                      styl = styl.join("\n");

                      var expected = [
                        'div {',
                        '  ' + String(prefix) + node.name + ': foo;',
                        '  ' + node.name + ': foo;',
                        '}'
                      ].join("\n");

                      var style = stylus(styl)
                                    .use(montblanc())
                                    .set('filename', node.name + '.styl');

                      style.render(function(err, css) {

                        if (err) {
                          throw err;
                        }

                        css.trim().should.equal(expected);
                      });

                    }.bind({
                      prefix: prefix,
                      vendor: vendor,
                    }));
                  }
                  break;
              }

            });

          }); // versions.forEach(function(version)
        } // for (var vers in stats[vendor])
      }
    }
  }
});
