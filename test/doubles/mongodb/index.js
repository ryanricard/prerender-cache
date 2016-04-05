var dbDouble = require('./db');

module.exports = {
  MongoClient: {
    connect: function(url, cb) { cb(undefined, dbDouble); }
  }
};