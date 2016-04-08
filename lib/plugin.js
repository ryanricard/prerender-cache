var assign = require('object-assign');

module.exports = function plugin(connector, options) {
  var defaultMiddlewareOptions = {
    warmingHeader: null,
    exclude: function () { return false; }
  };

  options = assign(defaultMiddlewareOptions, options);

  return {
    init: function() {
      // noop
    },

    beforePhantomRequest: function(req, res, next) {
      if (req.method !== 'GET') {
        next();
        return;
      }

      req.warming = Boolean(req.headers[options.warmingHeader]);

      if (req.warming) {
        next();
      } else {
        connector.get(req.url, function (err, record) {
          if (err) throw err;
          if (record && record.value) {
            res.send(200, record.value);
          } else {
            next();
          }
        });
      }
    },

    afterPhantomRequest: function(req, res, next) {
      if (!options.exclude(req)) {
        connector.set(req.url, {
          value: req.prerender.documentHTML,
          origin: req.warming ? 'warming' : 'standard',
          createdAt: new Date()
        });
      }

      next();
    }
  };
};