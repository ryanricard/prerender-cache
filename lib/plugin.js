var assign = require('object-assign');
var noop = function noop() {};

module.exports = function plugin(connector, options) {
  var defaultMiddlewareOptions = {
    warmingHeader: null,
    exclude: function () { return false; }
  };

  options = assign(defaultMiddlewareOptions, options);

  options.onBeforePhantomRequest = options.onBeforePhantomRequest || noop;

  return {
    init: function() {
      // noop
    },

    beforePhantomRequest: function(req, res, next) {
      if (req.method !== 'GET') {
        next();
        return;
      }

      // initialize plugin request object property
      req.prerenderCache = req.prerenderCache || {};

      // provide implementing application ability to alter request
      options.onBeforePhantomRequest.apply(this, arguments);

      // prepare prerender cache request properties
      req.prerenderCache.key = req.prerenderCache.key || req.prerender.url;
      req.prerenderCache.warming = req.prerenderCache.warming || Boolean(req.headers[options.warmingHeader]);


      if (req.prerenderCache.warming) {
        next();
      } else {
        connector.get(req.prerenderCache.key, function (err, record) {
          if (err) throw err;
          if (record && record.html) {
            res.send(200, record.html);
          } else {
            next();
          }
        });
      }
    },

    afterPhantomRequest: function(req, res, next) {
      if (!options.exclude(req, res)) {
        connector.set(req.prerenderCache.key, {
          html: req.prerender.documentHTML,
          origin: req.prerenderCache.warming ? 'warming' : 'standard',
          createdAt: new Date()
        });
      }

      next();
    }
  };
};