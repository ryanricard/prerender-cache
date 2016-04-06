var EventEmitter = require('events');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var calculateExpiration = require('../util').calculateExpiration;
var noop = function() {};

var TTL_INDEX_NAME = 'record_ttl';

var MongoStore = function MongoStore(options, onConnect, onCreateCollection) {
  options = options || {};

  this.url = options.url || 'mongodb://localhost:27017/prerender';
  this.collectionName = options.collectionName || 'pages';
  this.ttl = options.ttl || null;

  EventEmitter.call(this);

  this.connect(onConnect, onCreateCollection);

  return this;
};

util.inherits(MongoStore, EventEmitter);

MongoStore.prototype.connect = function connect(onConnect, onCreateCollection) {
  onConnect = onConnect || noop;
  onCreateCollection = onCreateCollection || noop;

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
        collection.dropIndex(TTL_INDEX_NAME, function(err, results) {
          if (err) throw err;
        });
      }

      onCreateCollection.apply(onCreateCollection, arguments);
    });
    onConnect.apply(onCreateCollection, arguments);
  });
};

MongoStore.prototype.get = function(key, callback) {
  var context = this;

  this.db.collection(this.collectionName, function(err, collection) {
    collection.findOne({ key: key }, function (err, item) {
      if (err) throw err;

      if (item && item.value) {
        context.emit('record:found', item);
      } else {
        context.emit('record:not-found', key);
      }
      callback.apply(callback, arguments);
    });
  });
};

MongoStore.prototype.set = function(key, record, callback) {
  var context = this;

  if (this.ttl > 0) record.expireAt = calculateExpiration(new Date(), this.ttl);

  this.db.collection(this.collectionName, function(err, collection) {
    collection.update({ key: key }, { $set: record }, { upsert: true }, function(err, result, upserted) {
      if (err) throw err;
      context.emit('record:persisted', result);
      callback.apply(callback, arguments);
    });
  });
};

module.exports = MongoStore;