var plugin = function plugin(options){

  return function(style){

    var nodes = this.nodes;

    style.define('cast', function(node, type) {

      if (node.nodeName === type.val) {
        return node.clone();
      }

      switch (type.val) {
        case 'string':
          var str = node.toString();
          return new nodes.String(str); // @todo Nope
          break;

        case 'unit':
          var literal = new nodes.Literal(node.string);
          return new nodes.Unit(parseFloat(literal.string));

        case 'literal':
          switch (node.nodeName) {
            case 'string':
              return new nodes.Literal(node.string);
            case 'unit':
              var a =  new nodes.Literal(node.val + '');
              return a;
          }

        default:
          throw 'Cannot cast node of type `' + node.nodeName + '` to type `' + type.val + '`';
      }

    });
  };

};

module.exports = plugin;