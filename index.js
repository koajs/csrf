var crypto = require('crypto')

exports = module.exports = function (app, opts) {
  if (isApp(app)) {
    opts = opts || {}
  } else {
    opts = app || {}
    app = null
  }

  // You can overwrite these yourself
  // so don't complain about entropy and
  // CSRF or salt lengths!
  var length = opts.length || 15
  var secret = opts.secret || exports.secret
  var salt = opts.salt || exports.salt
  var tokenize = opts.tokenize || exports.tokenize
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
      if (this._csrf)
        return this._csrf

      var sec =
      this.session.secret || (this.session.secret = secret(length))

      return this._csrf = tokenize(sec, salt())
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
      if (!secret)
        this.throw(403, 'invalid csrf token')

      var token = (body && body._csrf)
        || (this.query && this.query._csrf)
        || (this.get('x-csrf-token'))
        || (this.get('x-xsrf-token'))

      // invalid token value
      if (!token || typeof token !== 'string')
        this.throw(403, 'invalid csrf token')

      // incorrect token
      var salt = token.split('-').shift()
      if (token !== tokenize(secret, salt))
        this.throw(403, 'invalid csrf token')

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
 * Generates a random salt, using a fast non-blocking PRNG (Math.random()).
 * Yes, this isn't cryptographically secure,
 * but it doesn't matter.
 * Length of 10 by default.
 *
 * @return {String}
 * @api private
 */

var SALTCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
var SALTCHARSLENGTH = SALTCHARS.length

exports.salt = function (length) {
  length = length || 10
  var salt = ''

  for (var i = 0; i < length; ++i)
    salt += SALTCHARS[Math.floor(Math.random() * SALTCHARSLENGTH)]

  return salt
}

/*
 * Default CSRF token creation function.
 *
 * @param {String} secret
 * @param {String} salt
 * @return {String}
 * @api private
 */

exports.tokenize = function (secret, salt) {
  return salt + '-' + crypto
    .createHash('sha1')
    .update(salt + '-' + secret)
    .digest('base64')
}

/**
 * Create a CSRF secret key.
 *
 * @param {Number} length
 * @return {String}
 * @api private
 */

exports.secret = function (length) {
  return crypto.pseudoRandomBytes(length).toString('base64')
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

  try {
    // bodyparser middlewares maybe store body in request.body
    // or you can just set csrf token header
    this.assertCSRF(this.request.body)
  } catch (err) {
    if (err.status === 403) {
      this.status = 403
      this.body = 'invalid csrf token'
    } else {
      this.throw(err)
    }
    return
  }

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
