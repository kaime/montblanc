var semver     = require('semver'),
    makeSemver = require('./makeSemver');

var ubrowsers = require('../../src/data/browsers.json');

var browsers =  {};

for (var vendor in ubrowsers) {
  browsers[vendor] = ubrowsers[vendor];

  if ('versions' in browsers[vendor]) {

    var keys = [];

    for (var key in ubrowsers[vendor].versions) {
      keys.push(key);
    }

    keys.sort(function(a, b) {
      return semver.compare(makeSemver(a), makeSemver(b));
    });

    browsers[vendor]._versions = keys;
    browsers[vendor].id = vendor;
  }
}

module.exports = browsers;