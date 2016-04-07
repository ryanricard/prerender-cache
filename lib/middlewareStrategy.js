var assign = require('object-assign');

module.exports = function middlewareStrategy(Connector) {
  return function middleware(options) {
    var defaultMiddlewareOptions = {
      warmingHeader: null,
      exclude: function () { return false; }
    };

    options = assign(defaultMiddlewareOptions, options);

    var connector = new Connector(options);

    return {
      init: function() {
        // noop
      },

      beforePhantomRequest: function(req, res, next) {
        if (req.method !== 'GET') {
          next();
          return;
        }

        req.warming = Boolean(req.headers[connector.warmingHeader]);

        if (req.warming) {
          next();
        } else {
          this.connector.get(req.url, function (err, result) {
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
          this.connector.set(req.url, {
            value: req.prerender.documentHTML,
            origin: req.warming ? 'warming' : 'standard',
            createdAt: new Date()
          });
        }

        next();
      }
    };
  };
};