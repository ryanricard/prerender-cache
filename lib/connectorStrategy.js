var middleware = require('./middleware');

module.exports = function connectorStrategy(Connector) {
  return function getConnectorMiddleware(options) {
    var connector = new Connector(options);
    return assign(connector, middleware(connector, options));
  };
};