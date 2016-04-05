var itemDouble = require('./item');

module.exports = {
  createIndex: function(field, options, cb) { cb(); },
  findOne: function(key, cb) { cb(undefined, itemDouble); },
  update: function(selector, document, options, cb) { cb(); }
};
