var collectionDouble = require('./collection');

module.exports = {
  createCollection: function(name, cb) { cb(undefined, collectionDouble); },
  collection: function(name, cb) { cb(undefined, collectionDouble); }
};