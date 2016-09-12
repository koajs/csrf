
# Koa CSRF

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

> CSRF tokens for Koa >= 2.x (next).  For Koa < 2.x (next) see the 2.x branch.


## Install

> For koa@>=2.x (next):

```bash
npm install --save koa-csrf@3.x
```

> For koa@<2.x:

```bash
npm install --save koa-csrf@2.x
```


## Usage

1. Add middleware in Koa app (default options are shown):
  ```js
  import Koa from 'koa';
  import bodyParser from 'koa-bodyparser';
  import session from 'koa-generic-session';
  import convert from 'koa-convert';

  const app = new Koa();

  // set the session keys
  app.keys = [ 'a', 'b' ];

  // add session support
  app.use(convert(session()));

  // add body parsing
  app.use(bodyParser());

  // add the CSRF middleware
  app.use(new CSRF({
    invalidSessionSecretMessage: 'Invalid session secret',
    invalidSessionSecretStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
    disableQuery: false
  }));

  // your middleware here (e.g. parse a form submit)
  app.use((ctx, next) => {

    if (![ 'GET', 'POST' ].includes(ctx.method))
      return next();

    if (ctx.method === 'GET') {
      ctx.body = ctx.csrf;
      return;
    }

    ctx.body = 'OK';

  });

  app.listen();
  ```

2. Add the CSRF token in your template forms:

  > Jade Template:

  ```jade
  form(action='/register', method='POST')
    input(type='hidden', name='_csrf', value=csrf)
    input(type='email', name='email', placeholder='Email')
    input(type='password', name='password', placeholder='Password')
    button(type='submit') Register
  ```

  > EJS Template:

  ```ejs
  <form action="/register" method="POST">
    <input type="hidden" name="_csrf" value="<%= csrf %>" />
    <input type="email" name="email" placeholder="Email" />
    <input type="password" name="password" placeholder="Password" />
    <button type="submit">Register</button>
  </form>
  ```

## Open Source Contributor Requests

- [ ] Existing methods from 1.x package added to 3.x
- [ ] Existing tests from 1.x package added to 3.x


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
