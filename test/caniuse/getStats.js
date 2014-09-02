var semver      = require('semver');

var getRange    = require('./getRange'),
    mergeRanges = require('./mergeRanges'),
    makeSemver  = require('./makeSemver'),
    getBrowser  = require('./getBrowser');

var caniuse = {
  // This is a montblanc => caniuse-name lookup table
  vendors: require('./vendors.json'),
  // This is the full caniuse browser support and usage data
  data: require('./data/data.json')
};

caniuse.data.should.have.property('data');
caniuse.data['data'].should.be.an.Object;

caniuse.features = caniuse.data['data'];

function getPrefix(vendor, vers) {

  caniuse.data.agents[vendor].should.have.property('prefix');

  var prefix = caniuse.data.agents[vendor].prefix;

  if ('prefix_exceptions' in caniuse.data.agents[vendor]) {
    if (vers in caniuse.data.agents[vendor]['prefix_exceptions']) {
      prefix = caniuse.data.agents[vendor]['prefix_exceptions'][vers];
    }
  }

  prefix = '-' + prefix + '-';

  return prefix;
}

module.exports = function getStats(feature) {

  caniuse.features.should.have.property(feature);
  caniuse.features[feature].should.be.an.Object;
  caniuse.features[feature].should.have.property('stats');
  caniuse.features[feature].stats.should.be.an.Object;

  var data = caniuse.features[feature].stats,
      stats = [];

  for (var vendor in data) {

    var vers = [];

    for (var key in data[vendor]) {
      vers.push(key);
    }

    vers.sort(function(a, b) {
      var ar = getRange(a);
      ar = [makeSemver(ar[0]), makeSemver(ar[1])];

      a = semver.gt(ar[0], ar[1]) ? ar[0] : ar[1];

      var br = getRange(b);
      br = [makeSemver(br[0]), makeSemver(br[1])];
      b = semver.gt(br[0], br[1]) ? br[0] : br[1];

      return semver.compare(a, b);
    });

    vers.forEach(function(ver) {

      var browser = getBrowser(vendor, ver);

      // @todo
      if (ver === '0' || ver === '') return;

      var p = data[vendor][ver].split(' '),
          versions = getRange(ver),
          supported = false,
          partial = false,
          prefix = false;

      p.should.not.be.empty;

      switch (p[0]) {
        case 'y': // Supported
          supported = true;
          break;

        case 'a': // Partial support @todo warnings
          supported = true;
          partial = true;
          break;

        case 'n': // Not supported at all
        case 'p': // Not supported - polyfill available @todo
          break;
        case 'u': // Unknown
          return;

        default:
          throw "Unexpected status: " + p[0];
      }

      if (p.length > 1) {
        p[1].should.equal('x');
        prefix = getPrefix(vendor, ver);
      }

      if (stats.length > 0) {

        var last = stats[stats.length - 1];

        if (last.browser === browser &&
            last.supported === supported &&
            last.prefix === prefix
        ) {
            last.versions = mergeRanges(last.versions, versions)
            return;
        }
      }

      stats.push({
        browser:   browser,
        versions:  versions,
        supported: supported,
        partial:   partial,
        prefix:    prefix,
      });
    });

  }

  return stats;
}