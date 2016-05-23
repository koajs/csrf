var merge = require('lodash.merge')

var defaults = {
  getSecret: function (ctx) {
    if (!ctx.session) return null;
    return ctx.session.secret;
  },
  setSecret: function (ctx, secret) {
    if (!ctx.session) ctx.throw(500, 'session is missing')
    ctx.session.secret = secret;
  }
};

exports = module.exports = function (app, opts) {
  if (isApp(app)) {
    opts = merge({}, defaults, opts);
  } else {
    opts = merge({}, defaults, app);
    app = null
  }

  var tokens = require('csrf')(opts)
  var middleware = opts.middleware || exports.middleware

  if (app) {
    define(app)
    return app
  }

  return function* csrf(next) {
    define(this)
    yield middleware.call(this, next)
  }

  function define(ctx) {
    var context = ctx.context || ctx
    var response = ctx.response
    var request = ctx.request

    /*
     * Lazily creates a CSRF token.
     * Creates one per request.
     *
     * @api public
     */

    context.__defineGetter__('csrf', function () {
      if (this._csrf) return this._csrf
      var secret = opts.getSecret(this);
      if (secret === null) return null
      if (!secret) {
        opts.setSecret(this, secret = tokens.secretSync());
      }
      return this._csrf = tokens.create(secret)
    })

    response.__defineGetter__('csrf', function () {
      return this.ctx.csrf
    })

    /**
     * Asserts that a CSRF token exists and is valid.
     * Throws a 403 error otherwise.
     * var body = yield this.request.json()
     * try {
     *   this.assertCSRF(body)
     * } catch (err) {
     *   this.status = 403
     *   this.body = {
     *     message: 'invalid CSRF token'
     *   }
     * }
     *
     * @param {Object} body
     * @return {Context} this
     * @api public
     **/

    context.assertCSRF =
    context.assertCsrf = function (body) {
      // no session
      var secret = opts.getSecret(this)
      if (!secret) this.throw(403, 'secret is missing')

      var token = (body && body._csrf)
        || (this.query && this.query._csrf)
        || (this.get('x-csrf-token'))
        || (this.get('x-xsrf-token'))
        || body
      if (!token) this.throw(403, 'token is missing')
      if (!tokens.verify(secret, token)) this.throw(403, 'invalid csrf token')

      return this
    }

    request.assertCSRF =
    request.assertCsrf = function (body) {
      this.ctx.assertCsrf(body)
      return this
    }

  }
}

/**
 * a middleware to handle csrf check
 *
 * @api public
 */
exports.middleware = function* (next) {
  // ignore get, head, options
  if (this.method === 'GET'
    || this.method === 'HEAD'
    || this.method === 'OPTIONS') {
    return yield next
  }

  // bodyparser middlewares maybe store body in request.body
  // or you can just set csrf token header
  this.assertCSRF(this.request.body)

  yield next
}

/**
 * check if is koa app instance
 *
 * @api private
 */
function isApp(app) {
  return app && app.context && app.response && app.request
}
