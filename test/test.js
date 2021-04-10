const test = require('ava');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const session = require('koa-generic-session');
const convert = require('koa-convert');
const supertest = require('supertest');

const CSRF = require('..');

const tokenRegExp = /^\w+-[\w+/-]+/;

let app;
let request;
let requestWithOpts;

test.before.cb(t => {
  request = getApp({}, t.end);
});

test.cb('should create a token', t => {
  request
    .get('/')
    .expect(200)
    .expect(tokenRegExp)
    .end(t.end);
});

test.cb('should create a new token every request', t => {
  request
    .get('/')
    .expect(200)
    .expect(tokenRegExp)
    .end((err, res1) => {
      if (err) return t.end(err);
      request
        .get('/')
        .expect(tokenRegExp)
        .end((err, res2) => {
          if (err) return t.end(err);
          t.true(res1.text !== res2.text);
          t.end();
        });
    });
});

test.cb('should be invalid error when token is missing', t => {
  request
    .post('/')
    .expect(403)
    .end((err, res) => {
      if (err) return t.end(err);
      t.true(res.text === 'Invalid CSRF token');
      t.end();
    });
});

test.cb('should be invalid when token is incorrect', t => {
  request
    .post('/')
    .send({
      _csrf: 'wrong csrf token'
    })
    .expect(403)
    .end((err, res) => {
      if (err) return t.end(err);
      t.true(res.text === 'Invalid CSRF token');
      t.end();
    });
});

test.cb('should be valid when token is provided via json body', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/')
      .send({
        _csrf: res.text
      })
      .expect(200)
      .end(t.end);
  });
});

test.cb('should be valid when token is provided via query string', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/?_csrf=' + encodeURIComponent(res.text))
      .expect(200)
      .end(t.end);
  });
});

test.cb('should be valid when token is provided via csrf-token header', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/')
      .set('csrf-token', res.text)
      .expect(200)
      .end(t.end);
  });
});

test.cb('should be valid when token is provided via xsrf-token header', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/')
      .set('xsrf-token', res.text)
      .expect(200)
      .end(t.end);
  });
});

test.cb('should be valid when token is provided via x-csrf-token header', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/')
      .set('x-csrf-token', res.text)
      .expect(200)
      .end(t.end);
  });
});

test.cb('should be valid when token is provided via x-xsrf-token header', t => {
  request.get('/').end((err, res) => {
    if (err) return t.end(err);
    request
      .post('/')
      .set('x-xsrf-token', res.text)
      .expect(200)
      .end(t.end);
  });
});

test.serial.before.cb(t => {
  requestWithOpts = getApp({disableQuery: true}, t.end);
});

test.cb(
  'should not respect the _csrf querystring given disableQuery=true',
  t => {
    requestWithOpts.get('/').end((err, res) => {
      if (err) return t.end(err);
      requestWithOpts
        .post('/?_csrf=' + encodeURIComponent(res.text))
        .expect(403)
        .end((err, res) => {
          if (err) return t.end(err);
          t.true(res.text === 'Invalid CSRF token');
          t.end();
        });
    });
  }
);

function getApp(opts, cb) {
  app = new Koa();
  app.keys = ['a', 'b'];
  app.use(convert(session()));
  app.use(bodyParser());
  app.use(new CSRF(opts));
  app.use((ctx, next) => {
    if (!['GET', 'POST'].includes(ctx.method)) return next();
    if (ctx.method === 'GET') {
      ctx.body = ctx.csrf;
      return;
    }

    ctx.body = 'OK';
  });
  return supertest.agent(app.listen(cb));
}
