# Koa CSRF [![Build Status](https://travis-ci.org/koajs/csrf.png)](https://travis-ci.org/koajs/csrf)

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

Since people seem to really care about the entropy of CSRF tokens, the hashing algorithm, etc.
You can override these functions:

- `length` - Secret key length, default `15`.
- `secret` - `(length) -> [string]` a function that creates a secret stored as `this.session.secret`
- `salt` - `(length) -> [string]` a function that creates a salt.
- `tokenize` - `(secret, salt) -> salt;[string]` a function that creates the CSRF token.

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

You can use this module as a koa middleware, it is similar to `connect-csrf`.
in most situation, you only need:

```js
var koa = require('koa')
var csrf = require('koa-csrf')
var session = require('koa-session')

var app = koa()
app.keys = ['session secret']
app.use(session())
app.use(csrf())

app.use(function* () {
  if (this.method === 'GET') {
    this.body = this.csrf
  } else if (this.method === 'POST') {
    this.status = 204
  }
})
```

All the options work fine in middleware mode.

```js
app.use(csrf({
  length: 20
}))
```

You can redefinition csrf handle method by pass `opts.middleware`,
the default handler is `csrf.middleware`.

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
