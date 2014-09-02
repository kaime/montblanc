var semver     = require('semver'),
    makeSemver = require('./makeSemver');

module.exports = function mergeRanges(a, b) {

  var sa = [makeSemver(a[0]), makeSemver(a[1])],
      sb = [makeSemver(b[0]), makeSemver(b[1])];

  return [
    semver.lt(sa[0], sb[0]) ? a[0] : b[0],
    semver.gt(sa[1], sb[1]) ? a[1] : b[1]
  ];
}