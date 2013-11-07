# Koa CSRF [![Build Status](https://travis-ci.org/koajs/csrf.png)](https://travis-ci.org/koajs/csrf)

CSRF tokens for koa.

## API

To install, do:

```js
require('koa-csrf')(app)
```

Right now, you need to use [session](https://github.com/koajs/session) for CSRF to work.

### this.csrf

Lazily creates a CSRF token.
CSRF tokens change on every request.

```js
app.use(function (next) {
  return function* () {
    this.render({
      csrf: this.csrf
    })
  }
})
```

### this.checkCSRF([body])

Check the CSRF token of a request with an optional body.
Will throw if the CSRF token does not exist or is not valid.

```js
app.use(function (next) {
  return function* () {
    var body = yield this.request.body
    try {
      this.checkCSRF(body)
    } catch (err) {
      this.status = 403
      this.body = {
        message: 'This CSRF token is invalid!'
      }
      return
    }
  }
})
```

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