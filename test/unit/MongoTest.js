var TestHelper = require('../TestHelper');
var assertions = TestHelper.assertions;
var assert = TestHelper.assert;
var expect = TestHelper.expect;
var quibble = require('quibble');

// Doubles
var mongodbDouble = require('../doubles/mongodb/index');

quibble('mongodb', mongodbDouble);

describe('Requiring plugin', function() {
  describe('prerender-cache/mongo', function() {
    it('should load plugin constructor', function() {
      var constructor = require('../../mongo');

      expect(constructor).to.be.an.instanceof(Function);
    });

    it('should load prerender plugin when constructor is invoked', function() {
      var constructor = require('../../mongo');
      var plugin = constructor({});

      expect(plugin.init).to.be.an.instanceof(Function);
      expect(plugin.beforePhantomRequest).to.be.an.instanceof(Function);
      expect(plugin.afterPhantomRequest).to.be.an.instanceof(Function);
      expect(plugin.connect).to.be.an.instanceof(Function);
      expect(plugin.get).to.be.an.instanceof(Function);
      expect(plugin.set).to.be.an.instanceof(Function);
    });
  });
});