var TestHelper = require('../TestHelper');
var assertions = TestHelper.assertions;
var assert = TestHelper.assert;
var expect = TestHelper.expect;
var quibble = require('quibble');
var sinon = require('sinon');

// Doubles
var mongodbDouble = require('../doubles/mongodb/index');
var collectionDouble = require('../doubles/mongodb/collection');

quibble('mongodb', mongodbDouble);

var Cache = require('../../plugin/stores/mongo');

describe('Cache events', function() {
  describe('get()', function() {
    afterEach(function() {
      collectionDouble.findOne.restore();
    });

    it('should emit record found event', function(done) {
      assertions(2);

      sinon.stub(collectionDouble, 'findOne', function(key, cb) {
        cb(undefined, {
          value: 'winning'
        });
      });

      var cache = new Cache();

      cache.on('record:found', function(item) {
        expect(item.value).to.equal('winning');
      });

      cache.on('record:not-found', function(key) {
        assert(false, 'Cache instance should not emit a not found event when a record is found');
      });

      cache.get('/http://example.com/some/page', function(err, item) {
        expect(item.value).to.equal('winning');
        done();
      });
    });

    it('should emit record not found event', function(done) {
      assertions(2);

      sinon.stub(collectionDouble, 'findOne', function(key, cb) {
        cb();
      });

      var cache = new Cache();

      cache.on('record:found', function(key) {
        assert(false, 'Cache instance should not emit a found event when a record is not found');
      });

      cache.on('record:not-found', function(key) {
        expect(key).to.equal('/http://example.com/some/page');
      });

      cache.get('/http://example.com/some/page', function(err, item) {
        expect(item).to.be.undefined;
        done();
      });
    });
  });

  describe('set()', function() {
    it('should emit record persisted event upon a record being saved', function(done) {
      assertions(1);

      var cache = new Cache();

      cache.on('record:persisted', function() {
        assert(true, 'Cache instance should emit record persisted event when a record is saved');
      });

      cache.set('/http://example.com/some/page', { value: 'foobar' }, function(err, result, upserted) {
        done();
      });
    });
  });
});