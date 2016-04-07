var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var AbstractConnector = require('./AbstractConnector');
var calculateExpiration = require('../lib/util').calculateExpiration;

var NOOP = function() {};
var TTL_INDEX_NAME = 'record_ttl';

var MongoConnector = function MongoConnector(options, onConnect, onCreateCollection) {
  options = options || {};

  this.url = options.url || 'mongodb://localhost:27017/prerender';
  this.collectionName = options.collectionName || 'pages';
  this.ttl = options.ttl || null;

  this._super.apply(this, arguments);

  return this;
};

util.inherits(MongoConnector, AbstractConnector);

MongoConnector.prototype.connect = function connect(onConnect, onCreateCollection) {
  onConnect = onConnect || NOOP;
  onCreateCollection = onCreateCollection || NOOP;

  var context = this;

  MongoClient.connect(this.url, function(err, db) {
    if (err) throw err;
    context.db = db;
    context.db.createCollection(context.collectionName, function(err, collection) {
      if (err) throw err;

      if (context.ttl) {
        collection.ensureIndex({ createdAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: context.ttl }, function(err, results) {
          if (err) throw err;
        });
      } else {
        collection.indexInformation(function(err, indexes) {
          if (indexes[TTL_INDEX_NAME]) {
            collection.dropIndex(TTL_INDEX_NAME, function(err, results) {
              if (err) throw err;
            });
          }
        });
      }

      onCreateCollection.apply(onCreateCollection, arguments);
    });
    onConnect.apply(onCreateCollection, arguments);
  });
};

MongoConnector.prototype.get = function(key, callback) {
  var context = this;

  this.db.collection(this.collectionName, function(err, collection) {
    collection.findOne({ key: key }, function (err, item) {
      if (err) throw err;

      if (item && item.value) {
        context.emit('record:found', item.key, item.value);
      } else {
        context.emit('record:not-found', key);
      }
      callback.apply(callback, arguments);
    });
  });
};

MongoConnector.prototype.set = function(key, record, callback) {
  callback = callback || NOOP;

  var context = this;

  if (this.ttl > 0) record.expireAt = calculateExpiration(new Date(), this.ttl);

  context.emit('record:persisting', key, record);

  this.db.collection(this.collectionName, function(err, collection) {
    collection.update({ key: key }, { $set: record }, { upsert: true }, function(err, result, upserted) {
      if (err) throw err;
      context.emit('record:persisted', key, record);
      callback.apply(callback, arguments);
    });
  });
};

module.exports = MongoConnector;