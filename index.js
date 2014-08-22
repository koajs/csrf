
exports = module.exports = function (app, opts) {
  if (isApp(app)) {
    opts = opts || {}
  } else {
    opts = app || {}
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
    yield* middleware.call(this, next)
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
      var secret = this.session.secret
        || (this.session.secret = tokens.secretSync())
      return this._csrf = tokens.create(secret)
    })

    response.__defineGetter__('csrf', function () {
      return this.ctx.csrf
    })

    /**
     * Asserts that a CSRF token exists and is valid.
     * Throws a 403 error otherwise.
     * var body = yield* this.request.json()
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
      var secret = this.session.secret
      if (!secret) this.throw(403, 'invalid csrf token')

      var token = (body && body._csrf)
        || (this.query && this.query._csrf)
        || (this.get('x-csrf-token'))
        || (this.get('x-xsrf-token'))
        || body
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
    return yield* next
  }

  // bodyparser middlewares maybe store body in request.body
  // or you can just set csrf token header
  this.assertCSRF(this.request.body)

  yield* next
}

/**
 * check if is koa app instance
 *
 * @api private
 */
function isApp(app) {
  return app && app.context && app.response && app.request
}
