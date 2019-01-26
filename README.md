# koa-csrf

[![build status](https://img.shields.io/travis/koajs/csrf.svg)](https://travis-ci.com/koajs/csrf)
[![code coverage](https://img.shields.io/codecov/c/github/koajs/csrf.svg)](https://codecov.io/gh/koajs/csrf)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/koajs/csrf.svg)](LICENSE)

> CSRF tokens for Koa


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Options](#options)
* [Open Source Contributor Requests](#open-source-contributor-requests)
* [Contributors](#contributors)
* [License](#license)


## Install

> For versions of Koa &lt;2.x please use `koa-csrf@2.x`

[npm][]:

```sh
npm install koa-csrf
```

[yarn][]:

```sh
yarn add koa-csrf
```


## Usage

1. Add middleware in Koa app (default options are shown):

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
   app.use(new CSRF({
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


## Options

* `invalidTokenMessage` (String or Function) - defaults to `Invalid CSRF token`, but can also be a function that accepts one argument `ctx` (useful for i18n translation, e.g. using `ctx.request.t('some message')` via [@ladjs/i18n][]
* `invalidTokenStatusCode` (Number) - defaults to `403`
* `excludedMethods` (Array) - defaults to `[ 'GET', 'HEAD', 'OPTIONS' ]`
* `disableQuery` (Boolean) - defaults to `false`


## Open Source Contributor Requests

* [ ] Existing methods from 1.x package added to 3.x
* [ ] Existing tests from 1.x package added to 3.x


## Contributors

| Name           | Website                           |
| -------------- | --------------------------------- |
| **Nick Baugh** | <https://github.com/niftylettuce> |


## License

[MIT](LICENSE) © [Jonathan Ong](http://jongleberry.com)


## 

[@ladjs/i18n]: https://github.com/ladjs/i18n

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
