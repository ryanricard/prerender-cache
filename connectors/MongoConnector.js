var assert = require('assert');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var AbstractConnector = require('./AbstractConnector');
var calculateExpiration = require('../lib/util').calculateExpiration;

var NOOP = function() {};
var TTL_INDEX_PREFIX = 'document_ttl_';

var MongoConnector = function MongoConnector(options, onConnect, onCreateCollection) {
  options = options || {};

  // prepare options
  this.url = options.url || 'mongodb://localhost:27017/prerender';
  this.collectionName = options.collectionName || 'pages';
  this.index = typeof options.index === 'boolean' ? options.index : true;
  this.ttl = Number(options.ttl) || null;

  // assign connection name
  this.name = this.url;

  this._super.apply(this, arguments);

  return this;
};

util.inherits(MongoConnector, AbstractConnector);

MongoConnector.prototype.connect = function connect(onConnect, onCreateCollection) {
  onConnect = onConnect || NOOP;
  onCreateCollection = onCreateCollection || NOOP;

  var context = this;

  var ttlConfigured = Boolean(this.ttl);
  var currentIndexName = ttlConfigured ? TTL_INDEX_PREFIX + this.ttl : undefined;
  var matchIndexPrefix = RegExp('^' + TTL_INDEX_PREFIX);

  MongoClient.connect(this.url, function(err, db) {
    if (err) throw err;
    context.db = db;
    context.db.createCollection(context.collectionName, function(err, collection) {
      if (err) throw err;

      context.collection = collection;

      if (context.index) {
        collection.ensureIndex({ key: 1 }, { background: true }, function(err, results) {
          if (err) throw err;
        });
      } else {
        // Don't throw an error with callback; call should be idempotent, not interupting execution when index does not exist
        collection.dropIndex({ key: 1 });
      }

      collection.indexInformation(function(err, indexes) {
        var hasCurrentIndex = Boolean(indexes[currentIndexName]);
        var indexNames = Object.keys(indexes);

        // remove previously added ttl indexes that do not match the configured index
        indexNames.forEach(function(indexName) {
          var isCurrentIndex = indexName === currentIndexName;

          // if not the configured index but is a previously configured ttl index, drop it
          if (!isCurrentIndex && matchIndexPrefix.test(indexName)) {
            collection.dropIndex(indexName, function(err, results) {
              if (err) throw err;
            });
          }
        });

        // if configured index does not yet exist, create it
        if (ttlConfigured && !hasCurrentIndex) {
          collection.createIndex({ expireAt: 1 }, { name: currentIndexName, expireAfterSeconds: 0 }, function(err, results) {
            if (err) throw err;
          });
        }
      });

      onCreateCollection.apply(context, arguments);
    });
    onConnect.apply(context, arguments);
  });
};

MongoConnector.prototype.get = function(key, callback) {
  var context = this;

  assert(callback instanceof Function, 'a callback function must be passed to get a record');

  context.collection.findOne({ key: key }, function (err, item) {
    if (err) throw err;

    if (item && item.html) {
      context.emit('record:found', item.key, item.html);
    } else {
      context.emit('record:not-found', key);
    }
    callback.apply(callback, arguments);
  });
};

MongoConnector.prototype.set = function(key, record, callback) {
  callback = callback || NOOP;

  var context = this;

  if (this.ttl > 0) record.expireAt = calculateExpiration(new Date(), this.ttl);

  context.emit('record:saving', key, record);

  context.collection.update({ key: key }, { $set: record }, { upsert: true }, function(err, result, upserted) {
    if (err) throw err;
    context.emit('record:saved', key, record);
    callback.apply(callback, arguments);
  });
};

module.exports = MongoConnector;