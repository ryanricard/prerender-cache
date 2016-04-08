var TestHelper = require('../TestHelper');
var assertions = TestHelper.assertions;
var assert = TestHelper.assert;
var sinon = require('sinon');

// Doubles
var connectorDouble = {
  get: function() {},
  set: function() {}
};

// Assertion helpers
var resAssertSend = {
  send: function() {
    assert(true, 'middleware should invoke res.send()');
  }
};

var resAssertNoSend = {
  send: function() {
    assert(false, 'middleware should not invoke res.send()');
  }
};

var Middleware = require('../../lib/middleware');

describe('Plugin', function() {
  describe('beforePhantomRequest()', function() {
    afterEach(function() {
      connectorDouble.get.restore();
    });

    it('should not warm cache for non GET requests', function(done) {
      assertions(1);

      var expectation = sinon.mock(connectorDouble).expects('get').never();

      var req = { method: 'POST', headers: {} };

      var middleware = Middleware(connectorDouble, {});

      middleware.beforePhantomRequest(req, resAssertNoSend, function next() {
        assert(expectation.verify());
        done();
      });
    });

    it('should render page when not found in cache', function(done) {
      assertions(1);

      sinon.stub(connectorDouble, 'get').callsArgWith(1, undefined, null);

      var req = { method: 'GET', headers: {} };

      var middleware = Middleware(connectorDouble, {});

      middleware.beforePhantomRequest(req, resAssertNoSend, function next() {
        assert(true, 'middleware should invoke next()');
        done();
      });
    });

    it('should respond immediately when page is found in cache', function() {
      assertions(1);

      sinon.stub(connectorDouble, 'get').callsArgWith(1, undefined, { value: true });

      var req = { method: 'GET', headers: {} };

      var middleware = Middleware(connectorDouble, {});

      middleware.beforePhantomRequest(req, resAssertSend, function next() {
        assert(false, 'middleware should not invoke next()');
      });
    });

    it('should not query cache when warming header is received', function(done) {
      assertions(2);

      var expectation = sinon.mock(connectorDouble).expects('get').never();

      var req = { method: 'GET', headers: { 'some-header': 'true' } };

      var middleware = Middleware(connectorDouble, {
        warmingHeader: 'some-header'
      });

      middleware.beforePhantomRequest(req, resAssertNoSend, function next() {
        assert(true, 'middleware should invoke next()');
        done();
      });

      assert(expectation.verify());
    });
  });

  describe('afterPhantomRequest()', function() {
    var res = {};
    var req = {
      prerender: {
        documentHTML: '<b>foobar</b>'
      }
    };

    afterEach(function() {
      connectorDouble.set.restore();
    });

    it('should cache when exclude hook is not declared', function(done) {
      var expectation = sinon.mock(connectorDouble).expects('set').once();

      var middleware = Middleware(connectorDouble);

      middleware.afterPhantomRequest(req, res, function next() {
        assert(true, 'middleware should invoke next()');
        done();
      });

      assert(expectation.verify());
    });

    it('should cache when exclude hook evaluates to false', function(done) {
      var expectation = sinon.mock(connectorDouble).expects('set').once();

      var middleware = Middleware(connectorDouble, {
        exclude: function() {
          return false;
        }
      });

      middleware.afterPhantomRequest(req, res, function next() {
        assert(true, 'middleware should invoke next()');
        done();
      });

      assert(expectation.verify());
    });

    it('should not cache when exclude hook evaluates to true', function(done) {
      var expectation = sinon.mock(connectorDouble).expects('set').never();

      var middleware = Middleware(connectorDouble, {
        exclude: function() {
          return true;
        }
      });

      middleware.afterPhantomRequest(req, res, function next() {
        assert(true, 'middleware should invoke next()');
        done();
      });

      assert(expectation.verify());
    });
  });
});