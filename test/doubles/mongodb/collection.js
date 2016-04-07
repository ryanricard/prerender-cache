var itemDouble = require('./item');
var indexesDouble = require('./indexes');

module.exports = {
  ensureIndex: function(field, options, cb) { cb(); },
  indexInformation: function(cb) { cb(undefined, indexesDouble); },
  dropIndex: function(name, cb) { cb(); },
  findOne: function(key, cb) { cb(undefined, itemDouble); },
  update: function(selector, document, options, cb) { cb(); }
};
