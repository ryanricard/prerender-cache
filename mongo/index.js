var MongoConnector = require('../connectors/MongoConnector');

module.exports = require('../lib/connectorStrategy')(MongoConnector);