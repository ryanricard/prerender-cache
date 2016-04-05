var chai = require('chai');
var expected = 0;
var actual = 0;

module.exports.assert = function assert() {
  actual++;
  return chai.assert.apply(chai, arguments);
};

module.exports.expect = function expect() {
  actual++;
  return chai.expect.apply(chai, arguments);
};

module.exports.assertions = function assertions(n) {
  expected = n;
};

module.exports.reset = function reset() {
  expected = 0;
  actual = 0;
};

module.exports.check = function check() {
  if (!expected || expected === actual) return;
  if (this.currentTest.err) return;
  var err = new Error('expected ' + expected + ' assertions, got ' + actual);
  this.currentTest.emit('error', err);
};