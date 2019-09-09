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

test.before.cb(t => {
  app = new Koa();
  app.keys = ['a', 'b'];
  app.use(convert(session()));
  app.use(bodyParser());
  app.use(new CSRF());
  app.use((ctx, next) => {
    if (!['GET', 'POST'].includes(ctx.method)) return next();
    if (ctx.method === 'GET') {
      ctx.body = ctx.csrf;
      return;
    }

    ctx.body = 'OK';
  });
  request = supertest.agent(app.listen(t.end));
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
