var CassandraConnector = require('../connectors/CassandraConnector');

module.exports = require('../lib/connectorStrategy')(CassandraConnector);