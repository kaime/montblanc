var getRange = require('./getRange');

module.exports = function formatRange(range) {

  range = getRange(range);

  if (range[0] === range[1]) {
    return range[0];
  }

  return range[0] + ' - ' + range[1];
}