var assign = require('object-assign');
var plugin = require('./plugin');

module.exports = function connectorStrategy(Connector) {
  return function assignPlugin(options) {
    var connector = new Connector(options);
    return assign(connector, plugin(connector, options));
  };
};