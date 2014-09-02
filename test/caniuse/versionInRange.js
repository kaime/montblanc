var semver     = require('semver'),
    makeSemver = require('./makeSemver'),
    getRange   = require('./getRange');

module.exports = function versionInRange(version, range) {

  range = getRange(range);
  range = [makeSemver(range[0]), makeSemver(range[1])];
  version = makeSemver(version);

  return semver.gte(version, range[0]) && semver.lte(version, range[1]);
}