# Koa CSRF

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

CSRF tokens for koa.

## Install

```
npm install koa-csrf
```

## API

To install, do:

```js
require('koa-csrf')(app, options)
```

### Options

All options are passed to [csrf-tokens](https://github.com/expressjs/csrf-tokens).

### this.csrf

Lazily creates a CSRF token.
CSRF tokens change on every request.

```js
app.use(function* () {
  this.render({
    csrf: this.csrf
  })
})
```

### this.assertCSRF([body])

Check the CSRF token of a request with an optional body.
Will throw if the CSRF token does not exist or is not valid.

```js
app.use(function* () {
  var body = yield parse(this) // co-body or something
  try {
    this.assertCSRF(body)
  } catch (err) {
    this.status = 403
    this.body = {
      message: 'This CSRF token is invalid!'
    }
    return
  }
})
```

### Middleware

koa-csrf also provide a koa middleware, it is similar to `connect-csrf`.
in most situation, you only need:

```js
var koa = require('koa')
var csrf = require('koa-csrf')
var session = require('koa-session')

var app = koa()
app.keys = ['session secret']
app.use(session())
csrf(app)
app.use(csrf.middleware)

app.use(function* () {
  if (this.method === 'GET') {
    this.body = this.csrf
  } else if (this.method === 'POST') {
    this.status = 204
  }
})
```

[npm-image]: https://img.shields.io/npm/v/koa-csrf.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-csrf
[github-tag]: http://img.shields.io/github/tag/koajs/csrf.svg?style=flat-square
[github-url]: https://github.com/koajs/csrf/tags
[travis-image]: https://img.shields.io/travis/koajs/csrf.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/csrf
[coveralls-image]: https://img.shields.io/coveralls/koajs/csrf.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/csrf?branch=master
[david-image]: http://img.shields.io/david/koajs/csrf.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/csrf
[license-image]: http://img.shields.io/npm/l/koa-csrf.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-csrf.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-csrf
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat-square
[gittip-url]: https://www.gittip.com/jonathanong/
