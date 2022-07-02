# koa-csrf

[![build status](https://github.com/koajs/csrf/actions/workflows/ci.yml/badge.svg)](https://github.com/koajs/csrf/actions/workflows/ci.yml)
[![build status](https://img.shields.io/travis/koajs/csrf.svg)](https://travis-ci.com/koajs/csrf)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/koajs/csrf.svg)](LICENSE)

> CSRF tokens for Koa

> **NOTE:** As of v5.0.0+ `ctx.csrf`, `ctx_csrf`, and `ctx.response.csrf` are removed – instead use `ctx.state._csrf`.  Furthermore we have dropped `invalidTokenMessage` and `invalidTokenStatusCode` in favor of an `errorHandler` function option.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Options](#options)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install koa-csrf
```


## Usage

1. Add middleware in Koa app (see [options](#options) below):

   ```js
   const Koa = require('koa');
   const bodyParser = require('koa-bodyparser');
   const session = require('koa-generic-session');
   const convert = require('koa-convert');
   const CSRF = require('koa-csrf');

   const app = new Koa();

   // set the session keys
   app.keys = [ 'a', 'b' ];

   // add session support
   app.use(convert(session()));

   // add body parsing
   app.use(bodyParser());

   // add the CSRF middleware
   app.use(new CSRF());

   // your middleware here (e.g. parse a form submit)
   app.use((ctx, next) => {
     if (![ 'GET', 'POST' ].includes(ctx.method))
       return next();
     if (ctx.method === 'GET') {
       ctx.body = ctx.state._csrf;
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
     input(type='hidden', name='_csrf', value=_csrf)
     input(type='email', name='email', placeholder='Email')
     input(type='password', name='password', placeholder='Password')
     button(type='submit') Register
   ```

   > EJS Template:

   ```ejs
   <form action="/register" method="POST">
     <input type="hidden" name="_csrf" value="<%= _csrf %>" />
     <input type="email" name="email" placeholder="Email" />
     <input type="password" name="password" placeholder="Password" />
     <button type="submit">Register</button>
   </form>
   ```


## Options

* `errorHandler` (Function) - defaults to a function that returns `ctx.throw(403, 'Invalid CSRF token')`
* `excludedMethods` (Array) - defaults to `[ 'GET', 'HEAD', 'OPTIONS' ]`
* `disableQuery` (Boolean) - defaults to `false`
* `ignoredPathGlobs` (Array) - defaults to an empty Array, but you can pass an Array of glob paths to ignore


## Contributors

| Name            | Website                           |
| --------------- | --------------------------------- |
| **Nick Baugh**  | <https://github.com/niftylettuce> |
| **Imed Jaberi** | <https://www.3imed-jaberi.com/>   |


## License

[MIT](LICENSE) © [Jonathan Ong](http://jongleberry.com)


##

[npm]: https://www.npmjs.com/
