var MongoConnector = require('../connectors/MongoConnector');

module.exports = require('../lib/middlewareStrategy')(MongoConnector);