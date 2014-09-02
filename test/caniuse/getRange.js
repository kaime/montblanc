var semver     = require('semver'),
    makeSemver = require('./makeSemver');

module.exports = function getRange(r) {

  var range = [];

  if (typeof r === 'string') {
    range = r.split(/\s*\-\s*/)
  } else if (r instanceof Array) {
    range =r;
  }

  var l = range.length;

  if (l === 1) {
    range.push(range[0]);
  } else if (l !== 2) {
    throw new Error('Bad range: ' + r);
  }

  if (semver.gt(makeSemver(range[0]), makeSemver(range[1]))) {
    range = [range[1], range[0]];
  }

  return range;
}