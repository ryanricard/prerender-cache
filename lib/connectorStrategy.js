var assign = require('object-assign');
var plugin = require('./plugin');

module.exports = function connectorStrategy(Connector) {
  return function assignPlugin(options, onConnect, onCreateCollection) {
    var connector = new Connector(options, onConnect, onCreateCollection);
    return assign(connector, plugin(connector, options));
  };
};