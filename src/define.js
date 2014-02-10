var plugin = function plugin(options){

  return function(style){

    var nodes = this.nodes;

    style.define('define', function(name, value) {
        var scope = this.currentScope;
        var node = new nodes.Ident(name.val, value);
        scope.add(node);
    });
  };

};

module.exports = plugin;