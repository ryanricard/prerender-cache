var assert = require('assert');
var util = require('util');
var async = require('async');
var CassandraDriver = require('cassandra-driver');
var AbstractConnector = require('./AbstractConnector');
var calculateExpiration = require('../lib/util').calculateExpiration;

var NOOP = function() {};

var CassandraConnector = function CassandraConnector(options, onConnect, onCreateCollection) {
  options = options || {};

  // prepare options
  this.contactPoints = options.contactPoints || ['localhost:9042'];
  this.username = options.username || '';
  this.password = options.password || '';
  this.keyspace = options.keyspace || 'prerender';
  this.table = options.table || 'pages';
  this.ttl = Number(options.ttl) || null;
  // if table exists and immutableWrite option is changed, the table will need to be recreated
  this.immutableWrite = typeof options.immutableWrite === 'boolean' ? options.immutableWrite : false;

  // assign connection name
  this.name = this.contactPoints.join(', ');

  this.keyspaceTable = this.keyspace + '.' + this.table;

  this._super.apply(this, arguments);

  return this;
};

util.inherits(CassandraConnector, AbstractConnector);

CassandraConnector.prototype.connect = function connect(onConnect, onCreateCollection) {
  onConnect = onConnect || NOOP;
  onCreateCollection = onCreateCollection || NOOP;

  var context = this;

  this.authProvider = new CassandraDriver.auth.PlainTextAuthProvider(this.username, this.password);
  this.client = new CassandraDriver.Client({
    contactPoints: this.contactPoints,
    authProvider: this.authProvider
  });

  async.series([
    function(next) {
      context.client.connect(function (err) {
        if (err) throw err;
        next();
      });
    },

    function(next) {
      var query = "CREATE KEYSPACE IF NOT EXISTS " + context.keyspace + " WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";
      context.client.execute(query, function(err) {
        if (err) throw err;
        next();
      });
    },

    function(next) {
      var query = [
        'CREATE TABLE IF NOT EXISTS ' + context.keyspaceTable + ' (',
        'key text,',
        'html text,',
        'origin text,',
        'expire_at timestamp,'
      ];

      // if table exists and immutableWrite option is changed, the table will need to be recreated
      if (context.immutableWrite) {
        query.push(
          'created_at timeuuid,',
          'PRIMARY KEY ((key), created_at)',
          ') WITH gc_grace_seconds = 0 AND CLUSTERING ORDER BY (created_at DESC);'
        );
      } else {
        query.push(
          'created_at timestamp,',
          'PRIMARY KEY (key)',
          ') WITH gc_grace_seconds = 0;'
        );
      }

      query = query.join(' ');

      context.client.execute(query, function(err) {
        if (err) throw err;
        onCreateCollection.apply(context, arguments);
        next();
      });
    },
  ], onConnect.bind(context));
};

CassandraConnector.prototype.get = function get(key, callback) {
  var context = this;

  assert(callback instanceof Function, 'a callback function must be passed to get a record');

  var query = "SELECT key, html FROM " + this.keyspaceTable + " WHERE key = ? LIMIT 1";

  this.client.execute(query, [key], { prepare: true }, function (err, result) {
    if (err) throw err;

    var item = result.first();

    if (item && item.html) {
      context.emit('record:found', item.key, item.html);
    } else {
      context.emit('record:not-found', key);
    }

    callback.call(callback, err, item);
  });
};

CassandraConnector.prototype.set = function set(key, record, callback) {
  callback = callback || NOOP;

  var context = this;

  context.emit('record:saving', key, record);

  var now = context.immutableWrite ? 'now()' : 'dateOf(now())';
  var query = 'INSERT INTO ' + this.keyspaceTable + ' (key, html, origin, created_at, expire_at) VALUES (?, ?, ?, ' + now + ', ?)';

  if (this.ttl > 0) {
    record.expireAt = calculateExpiration(new Date(), this.ttl);
    query += ' USING TTL ' + this.ttl;
  }

  this.client.execute(query, [key, record.html, record.origin, record.expireAt], { prepare: true }, function (err, result) {
    if (err) throw err;
    context.emit('record:saved', key, record);
    callback.apply(callback, arguments);
  });
};

module.exports = CassandraConnector;