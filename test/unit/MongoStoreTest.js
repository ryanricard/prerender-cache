var TestHelper = require('../TestHelper');
var assertions = TestHelper.assertions;
var assert = TestHelper.assert;
var expect = TestHelper.expect;
var quibble = require('quibble')
var sinon = require('sinon');

// Doubles
var mongodbDouble = require('../doubles/mongodb/index');
var dbDouble = require('../doubles/mongodb/db');
var collectionDouble = require('../doubles/mongodb/collection');

quibble('mongodb', mongodbDouble);

var Cache = require('../../plugin/stores/mongo')

describe('Cache', function() {
  describe('constructor', function() {
    it('should invoke constructor hooks', function(done) {
      assertions(2);

      var cache = new Cache(null, function onConnect() {
        assert(true, 'Cache should invoke connect hook');
      }, function onCreateCollection() {
        assert(true, 'Cache should invoke create collection hook');
        done();
      });
    });
  });

  describe('connect()', function() {
    afterEach(function() {
      mongodbDouble.MongoClient.connect.restore();
    });

    it('should connect to mongo with default options', function() {
      sinon.spy(mongodbDouble.MongoClient, 'connect');

      var cache = new Cache();

      assert(mongodbDouble.MongoClient.connect.calledOnce);
      assert(mongodbDouble.MongoClient.connect.calledWith('mongodb://localhost:27017/prerender'));
    });

    it('should connect to mongo with custom options', function() {
      sinon.spy(mongodbDouble.MongoClient, 'connect');

      var cache = new Cache({
        url: 'mongodb://example:27017'
      });

      assert(mongodbDouble.MongoClient.connect.calledOnce);
      assert(mongodbDouble.MongoClient.connect.calledWith('mongodb://example:27017'));
    });
  });

  describe('createCollection()', function() {
    afterEach(function() {
      dbDouble.createCollection.restore();
    });

    it('should create collection with default options', function() {
      sinon.spy(dbDouble, 'createCollection');

      var cache = new Cache();

      assert(dbDouble.createCollection.calledOnce);
      assert(dbDouble.createCollection.calledWith('pages'));
    });

    it('should connect to mongo with custom options', function() {
      sinon.spy(dbDouble, 'createCollection');

      var cache = new Cache({
        collectionName: 'records'
      });

      assert(dbDouble.createCollection.calledOnce);
      assert(dbDouble.createCollection.calledWith('records'));
    });
  });

  describe('get()', function() {
    afterEach(function() {
      collectionDouble.findOne.restore();
    });

    it('should call collection.findOne() with correct params and invoke callback with expected value', function(done) {
      sinon.spy(collectionDouble, 'findOne');

      var cache = new Cache();

      cache.get('/http://example.com/some/page', function(err, item) {
        // spy assertions
        var args = collectionDouble.findOne.args[0];
        assert(collectionDouble.findOne.calledOnce);
        expect(args[0].key).to.equal('/http://example.com/some/page');

        // callback assertions
        expect(item.value.foo).to.equal('bar');

        done();
      });
    });
  });

  describe('set()', function() {
    afterEach(function() {
      collectionDouble.update.restore();
    });

    it('should call collection.update() with correct params', function(done) {
      sinon.spy(collectionDouble, 'update');

      var cache = new Cache();

      cache.set('/http://example.com/some/page', { foo: 'bar' }, function(err, value) {
        // spy assertions
        var args = collectionDouble.update.args[0];
        assert(collectionDouble.update.calledOnce);
        expect(args[0].key).to.equal('/http://example.com/some/page');
        expect(args[1].$set.foo).to.equal('bar');

        // callback assertions
        expect(args[2].upsert).to.be.true;

        done();
      });
    });
  });
});