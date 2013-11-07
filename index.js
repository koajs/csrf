var crypto = require('crypto')
var merge = require('merge-descriptors')

exports = module.exports = function (app) {
  merge(app.Context.prototype, exports)
  return app
}

/*
 * Lazily creates a CSRF token.
 * Creates one per request.
 *
 * @api public
 */

exports.__defineGetter__('csrf', function () {
  return this._csrf
    || (this._csrf = this.csrfCreate())
})

/*
 * Check for a CSRF token with an optional body.
 *
 * var body = yield this.request.body
 * try {
 *   this.checkCSRF(body)
 * } catch (err) {
 *   this.status = 403
 *   this.body = {
 *     message: 'invalid CSRF token'
 *   }
 * }
 *
 * @api public
 */

exports.checkCsrf =
exports.checkCSRF = function (body) {
  var token = (body && body._csrf)
    || (this.query && this.query._csrf)
    || (this.get('x-csrf-token'))
    || (this.get('x-xsrf-token'))

  if (!token || typeof token !== 'string')
    this.error(403, 'invalid csrf token')

  var salt = token.split(';').shift()
  if (token !== this.csrfCreate(salt))
    this.error(403, 'invalid csrf token')

  return this
}

/*
 * CSRF token secret. By default, it's the cookie session's id.
 * If you want to use a different secret, overwrite this value.
 *
 * @api private
 */

exports.__defineGetter__('csrfSecret', function () {
  return this.session.id
})

/**
 * Generates a random salt, using a fast non-blocking PRNG (Math.random()).
 * Taken from connect.
 *
 * @param {Number} length
 * @return {String}
 * @api private
 */

var SALTCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

exports.csrfSalt = function (length) {
  length = length || 10;
  var i, r = [];
  for (i = 0; i < length; ++i) {
    r.push(SALTCHARS[Math.floor(Math.random() * SALTCHARS.length)]);
  }
  return r.join('');
}

/*
 * Create a token from a salt.
 *
 * @api private
 */

exports.csrfCreate = function (salt) {
  salt = salt || this.csrfSalt()

  return salt + ';' + crypto
    .createHash('sha1')
    .update(salt + ';' + this.csrfSecret)
    .digest('base64')
}