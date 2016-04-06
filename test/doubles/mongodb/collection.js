var itemDouble = require('./item');

module.exports = {
  ensureIndex: function(field, options, cb) { cb(); },
  dropIndex: function(name, cb) { cb(); },
  findOne: function(key, cb) { cb(undefined, itemDouble); },
  update: function(selector, document, options, cb) { cb(); }
};
