var MongoClient = require('mongodb').MongoClient;
var noop = function() {};

var MongoStore = function MongoStore(options, onConnect, onCreateCollection) {
  options = options || {};

  this.url = options.url || 'mongodb://localhost:27017/prerender';
  this.collectionName = options.collectionName || 'pages';

  this.connect(onConnect, onCreateCollection);

  return this;
};

MongoStore.prototype.connect = function connect(onConnect, onCreateCollection) {
  onConnect = onConnect || noop;
  onCreateCollection = onCreateCollection || noop;

  var context = this;

  MongoClient.connect(this.url, function(err, db) {
    if(err) throw err;
    context.db = db;
    context.db.createCollection(context.collectionName, function(err, collection){
      if(err) throw err;
      onCreateCollection.apply(onCreateCollection, arguments);
    })
    onConnect.apply(onCreateCollection, arguments);
  });
};

MongoStore.prototype.get = function(key, callback) {
  this.db.collection(this.collectionName, function(err, collection) {
    collection.findOne({key: key}, function (err, item) {
      if(err) throw err;
      callback.apply(callback, arguments);
    });
  });
};

MongoStore.prototype.set = function(key, record, callback) {
  this.db.collection(this.collectionName, function(err, collection) {
    collection.update({ key: key }, { $set: record }, { upsert: true }, function(err, result, upserted) {
      if(err) throw err;
      callback.apply(callback, arguments);
    })
  });
};

module.exports = MongoStore;