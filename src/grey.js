var plugin = function plugin(options){

  return function(style){

    var nodes = this.nodes;

    function grey(level, alpha) {
      if (level && level.nodeName !== 'null') {
        var l, a;

        if (level.nodeName === 'unit') {
          l = level.val;
          if (level.type === '%') {
            l = l / 100;
          }
        }

        l = 1 - l

        if (arguments.length > 1) {
          a = alpha.val;
          if (alpha.type === '%') {
            a = a / 100;
          }
        } else {
          a = 1;
        }

        return new nodes.RGBA(l * 255, l * 255, l * 255, a);

      } else {
        return new nodes.RGBA(128, 128, 128, 1);
      }
    }

    style.define('grey', grey);
    style.define('gray', grey);
  };

};

module.exports = plugin;