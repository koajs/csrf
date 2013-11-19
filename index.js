var crypto = require('crypto')

exports = module.exports = function (app, opts) {
  opts = opts || {}

  // You can overwrite these yourself
  // so don't complain about entropy and
  // CSRF or salt lengths!
  var secret = opts.secret || exports.secret
  var salt = opts.salt || exports.salt
  var tokenize = opts.tokenize || exports.tokenize

  /*
   * Lazily creates a CSRF token.
   * Creates one per request.
   *
   * @api public
   */

  app.context.__defineGetter__('csrf', function () {
    return this._csrf
      || (this._csrf = tokenize(secret.call(this), salt()))
  })

  app.response.__defineGetter__('csrf', function () {
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

  app.context.assertCSRF =
  app.context.assertCsrf = function (body) {
    var token = (typeof body === 'object' && body._csrf)
      || (this.query && this.query._csrf)
      || (this.get('x-csrf-token'))
      || (this.get('x-xsrf-token'))

    if (!token || typeof token !== 'string')
      this.error(403, 'invalid csrf token')

    var salt = token.split(';').shift()
    if (token !== tokenize(secret.call(this), salt))
      this.error(403, 'invalid csrf token')

    return this
  }

  app.request.assertCSRF =
  app.request.assertCsrf = function (body) {
    this.ctx.assertCsrf(body)
    return this
  }

  return app
}

/*
 * Default secret token for CSRF.
 * By default, this is for cookie sessions whose secret
 * is the id, which is not actually secret.
 * For session stores, you probably want to have a
 * private `.secret` token.
 *
 * @api private
 */

exports.secret = function () {
  return this.session.sid
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

exports.salt = function () {
  var salt = ''

  for (var i = 0; i < 10; ++i)
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
  return salt + ';' + crypto
    .createHash('sha1')
    .update(salt + ';' + secret)
    .digest('base64')
}