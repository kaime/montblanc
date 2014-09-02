var semver      = require('semver'),
    getRange    = require('./getRange'),
    makeSemver  = require('./makeSemver'),
    browsers    = require('./browsers'),
    caniuse     = {
                    // This is a montblanc => caniuse-name lookup table
                    vendors: require('./vendors.json')
                  },
    regver = /^[0-9]+(\.[0-9]+){0,2}$/;

module.exports = function getBrowser(vendor, version) {

  var ret = false;

  for (var browser in caniuse.vendors) {

    var p = caniuse.vendors[browser].split(/([<>=\s]+)/),
        l = p.length;

    l.should.be.greaterThan(0);

    if (p[0] === vendor) {

      if (l > 1) {

        if (version) {

          var versions = getRange(version),
              range = '';

          versions = [makeSemver(versions[0]), makeSemver(versions[1])];

          for (var i = 1; i < l; i++) {
            if (regver.test(p[i])) {
              range += makeSemver(p[i]);
            } else {
              range += p[i];
            }
          }

          if (!semver.satisfies(versions[0], range) ||
              !semver.satisfies(versions[1], range))
              {
              continue;
          } else {

          }
        }
      }

      browsers.should.have.property(browser);

      return browsers[browser];
    }
  }
}