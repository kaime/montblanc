var semver = require('semver');

module.exports = function makeSemver(ver) {

  var version = semver.valid(ver);

  if (version === null) {

    var p = ver.split('.');

    for (var i = 0, l = 3 - p.length; i < l; i++) {
      ver += '.0';
    }

    version = semver.valid(ver);
  }

  return version;
}