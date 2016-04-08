var plugin = require('./plugin');

module.exports = function connectorStrategy(Connector) {
  return function getConnectorPlugin(options) {
    var connector = new Connector(options);
    return assign(connector, plugin(connector, options));
  };
};