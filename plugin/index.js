var path = require('path');
var assign = require('object-assign');

module.exports = function prerenderCache(options) {
  var defaultOptions = {
    store: 'mongo',
    warmingHeader: null,
    exclude: function () { return false; }
  };

  options = assign(defaultOptions, options || {});

  var Store = require(path.resolve(__dirname, 'stores/', options.store));

  var store = new Store({
    url: options.url,
    collectionName: options.collectionName,
    ttl: options.ttl
  });

  return {
    init: function() {
      // noop
    },

    beforePhantomRequest: function(req, res, next) {
      if (req.method !== 'GET') {
        next();
        return;
      }

      req.warming = Boolean(req.headers[store.warmingHeader]);

      if (req.warming) {
        next();
      } else {
        this.store.get(req.url, function (err, result) {
          if (err) throw err;
          if (result) {
            res.send(200, result);
          } else {
            next();
          }
        });
      }
    },

    afterPhantomRequest: function(req, res, next) {
      if (!options.exclude(req)) {
        this.store.set(req.url, {
          value: req.prerender.documentHTML,
          origin: req.warming ? 'warming' : 'standard',
          createdAt: new Date()
        });
      }

      next();
    }
  };
};