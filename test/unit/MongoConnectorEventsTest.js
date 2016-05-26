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

var MongoConnector = require('../../connectors/MongoConnector');

describe('MongoConnector events', function() {
  describe('get()', function() {
    afterEach(function() {
      collectionDouble.findOne.restore();
    });

    it('should emit record found event', function(done) {
      assertions(2);

      sinon.stub(collectionDouble, 'findOne', function(key, cb) {
        cb(undefined, {
          html: 'winning'
        });
      });

      var connector = new MongoConnector();

      connector.on('record:found', function(key, record) {
        expect(record).to.equal('winning');
      });

      connector.on('record:not-found', function(key) {
        assert(false, 'MongoConnector instance should not emit a not found event when a record is found');
      });

      connector.get('/http://example.com/some/page', function(err, item) {
        expect(item.html).to.equal('winning');
        done();
      });
    });

    it('should emit record not found event', function(done) {
      assertions(2);

      sinon.stub(collectionDouble, 'findOne', function(key, cb) {
        cb();
      });

      var connector = new MongoConnector();

      connector.on('record:found', function(key) {
        assert(false, 'MongoConnector instance should not emit a found event when a record is not found');
      });

      connector.on('record:not-found', function(key) {
        expect(key).to.equal('/http://example.com/some/page');
      });

      connector.get('/http://example.com/some/page', function(err, item) {
        expect(item).to.be.undefined;
        done();
      });
    });
  });

  describe('set()', function() {
    it('should emit record persisted event upon a record being saved', function(done) {
      assertions(2);

      var connector = new MongoConnector();

      connector.on('record:saving', function() {
        assert(true, 'MongoConnector instance should emit an event prior to record being saved');
      });

      connector.on('record:saved', function() {
        assert(true, 'MongoConnector instance should emit an event when a record is saved');
      });

      connector.set('/http://example.com/some/page', { html: 'foobar' }, function(err, result, upserted) {
        done();
      });
    });
  });
});