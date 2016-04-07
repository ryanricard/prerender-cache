var EventEmitter = require('events');
var util = require('util');

var AbstractConnector = function AbstractConnector() {};

util.inherits(AbstractConnector, EventEmitter);

AbstractConnector.prototype._super = function _super(options, onConnect, onCreateCollection) {
  EventEmitter.call(this);

  this.connect(onConnect, onCreateCollection);

  return this;
};

AbstractConnector.prototype.connect = function connect() {
  throw new Error('Connector .connect() method not implemented.');
};

AbstractConnector.prototype.get = function get() {
  throw new Error('Connector .get() method not implemented.');
};

AbstractConnector.prototype.set = function set() {
  throw new Error('Connector .set() method not implemented.');
};

module.exports = AbstractConnector;