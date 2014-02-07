
module.exports = function plugin() {
  return function() {
    this.import(__dirname);
  }
};

module.exports.path = __dirname;