# Koa CSRF [![Build Status](https://travis-ci.org/koajs/csrf.svg)](https://travis-ci.org/koajs/csrf)

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
