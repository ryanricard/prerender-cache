var TestHelper = require('../TestHelper');
var assertions = TestHelper.assertions;
var assert = TestHelper.assert;
var expect = TestHelper.expect;
var quibble = require('quibble');
var sinon = require('sinon');

// Doubles
var mongodbDouble = require('../doubles/mongodb/index');
var dbDouble = require('../doubles/mongodb/db');
var collectionDouble = require('../doubles/mongodb/collection');

quibble('mongodb', mongodbDouble);

var MongoConnector = require('../../connectors/MongoConnector');

describe('MongoConnector', function() {
  describe('constructor', function() {
    it('should invoke constructor hooks', function(done) {
      assertions(2);

      new MongoConnector(null, function onConnect() {
        assert(true, 'MongoConnector should invoke connect hook');
      }, function onCreateCollection() {
        assert(true, 'MongoConnector should invoke create collection hook');
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

      new MongoConnector();

      assert(mongodbDouble.MongoClient.connect.calledOnce);
      assert(mongodbDouble.MongoClient.connect.calledWith('mongodb://localhost:27017/prerender'));
    });

    it('should connect to mongo with custom options', function() {
      sinon.spy(mongodbDouble.MongoClient, 'connect');

      new MongoConnector({
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

      new MongoConnector();

      assert(dbDouble.createCollection.calledOnce);
      assert(dbDouble.createCollection.calledWith('pages'));
    });

    it('should connect to mongo with custom options', function() {
      sinon.spy(dbDouble, 'createCollection');

      new MongoConnector({
        collectionName: 'records'
      });

      assert(dbDouble.createCollection.calledOnce);
      assert(dbDouble.createCollection.calledWith('records'));
    });
  });

  describe('configure collection ttl', function() {
    afterEach(function() {
      collectionDouble.ensureIndex.restore
        && collectionDouble.ensureIndex.restore();
      collectionDouble.indexInformation.restore
        && collectionDouble.indexInformation.restore();
      collectionDouble.dropIndex.restore
        && collectionDouble.dropIndex.restore();
    });

    it('should drop index when an index exists and a ttl is not specified', function() {
      sinon.stub(collectionDouble, 'indexInformation').yields(undefined, { record_ttl: 1 });

      var ensureIndexMock = sinon.mock(collectionDouble).expects('ensureIndex').never();
      var dropIndexMock = sinon.mock(collectionDouble).expects('dropIndex').once().withArgs('record_ttl');

      new MongoConnector();

      assert(ensureIndexMock.verify());
      assert(dropIndexMock.verify());
    });

    it('should not drop index when an index does not exists and a ttl is not specified', function() {
      sinon.stub(collectionDouble, 'indexInformation').yields(undefined, { unknown_index: 1 });

      var ensureIndexMock = sinon.mock(collectionDouble).expects('ensureIndex').never();
      var dropIndexMock = sinon.mock(collectionDouble).expects('dropIndex').never();

      new MongoConnector();

      assert(ensureIndexMock.verify());
      assert(dropIndexMock.verify());
    });

    it('should ensure an index exists when a ttl is specified', function() {
      sinon.spy(collectionDouble, 'ensureIndex');

      var dropIndexMock = sinon.mock(collectionDouble).expects('dropIndex').never();
      var ttl = 1234;

      new MongoConnector({
        ttl: ttl
      });

      var args = collectionDouble.ensureIndex.args[0];

      assert(collectionDouble.ensureIndex.calledOnce);
      expect(args[0].createdAt).to.equal(1);
      expect(args[1].expireAfterSeconds).to.equal(ttl);
      assert(dropIndexMock.verify());
    });
  });

  describe('get()', function() {
    afterEach(function() {
      collectionDouble.findOne.restore
        && collectionDouble.findOne.restore();
    });

    it('should call collection.findOne() with correct params and invoke callback with expected value', function(done) {
      sinon.spy(collectionDouble, 'findOne');

      var connector = new MongoConnector();

      connector.get('/http://example.com/some/page', function(err, item) {
        // spy assertions
        var args = collectionDouble.findOne.args[0];
        assert(collectionDouble.findOne.calledOnce);
        expect(args[0].key).to.equal('/http://example.com/some/page');

        // callback assertions
        expect(item.value.foo).to.equal('bar');

        done();
      });
    });

    it('should require a callback be passed', function() {
      var connector = new MongoConnector();

      expect(function() {
        connector.get('/http://example.com/some/page');
      }).to.throw('a callback function must be passed to get a record');
    });
  });

  describe('set()', function() {
    afterEach(function() {
      collectionDouble.update.restore
        && collectionDouble.update.restore();
    });

    it('should call collection.update() with correct params', function(done) {
      sinon.spy(collectionDouble, 'update');

      var connector = new MongoConnector();

      connector.set('/http://example.com/some/page', { foo: 'bar' }, function(err, value) {
        // spy assertions
        var args = collectionDouble.update.args[0];
        assert(collectionDouble.update.calledOnce);
        expect(args[0].key).to.equal('/http://example.com/some/page');
        expect(args[1].$set.foo).to.equal('bar');

        // callback assertions
        assert(args[2].upsert);

        done();
      });
    });

    it('should persist record without ttl when not specified', function(done) {
      sinon.spy(collectionDouble, 'update');

      var connector = new MongoConnector();

      connector.set('/http://example.com/some/page', { foo: 'bar', expireAt: null }, function(err, value) {
        // spy assertions
        var record = collectionDouble.update.args[0][1].$set;
        expect(record.expireAt).to.be.null;

        done();
      });
    });

    it('should persist record with ttl when specified', function(done) {
      sinon.spy(collectionDouble, 'update');

      var now = new Date();
      var ttl = 432000; // seconds
      var threshold = 2; // seconds

      var connector = new MongoConnector({
        ttl: ttl
      });

      connector.set('/http://example.com/some/page', { foo: 'bar' }, function(err, value) {
        // spy assertions
        var record = collectionDouble.update.args[0][1].$set;
        var duration = (record.expireAt.getTime() - now.getTime()) / 1000; // duration in seconds
        expect(duration).to.be.within(ttl, ttl + threshold);

        done();
      });
    });

    it('should not require a callback be passed', function() {
      var connector = new MongoConnector();

      expect(function() {
        connector.set('/http://example.com/some/page', { foo: 'bar' });
      }).to.not.throw(Error);
    });
  });
});