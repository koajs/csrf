const test = require('ava');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const session = require('koa-generic-session');
const supertest = require('supertest');

const CSRF = require('..');

const tokenRegExp = /^\w+-[\w+/-]+/;

test.before((t) => {
  t.context.request = getApp();
  t.context.requestWithOpts = getApp({
    disableQuery: true,
    ignoredPathGlobs: ['/beep']
  });
});

test('should create a token', async (t) => {
  const res = await t.context.request.get('/');
  t.is(res.status, 200);
  t.regex(res.text, tokenRegExp);
});

test('should create a new token every request', async (t) => {
  const res1 = await t.context.request.get('/');
  t.is(res1.status, 200);
  t.regex(res1.text, tokenRegExp);
  const res2 = await t.context.request.get('/');
  t.regex(res2.text, tokenRegExp);
  t.true(res1.text !== res2.text);
});

test('should be invalid error when token is missing', async (t) => {
  const res = await t.context.request.post('/');
  t.is(res.status, 403);
  t.is(res.text, 'Invalid CSRF token');
});

test('should be invalid when token is incorrect', async (t) => {
  const res = await t.context.request.post('/').send({
    _csrf: 'wrong csrf token'
  });
  t.is(res.status, 403);
  t.is(res.text, 'Invalid CSRF token');
});

test('should be valid when token is provided via json body', async (t) => {
  const res1 = await t.context.request.get('/');
  t.is(res1.status, 200);
  const res2 = await t.context.request.post('/').send({
    _csrf: res1.text
  });
  t.is(res2.status, 200);
});

test('should be valid when token is provided via query string', async (t) => {
  const res1 = await t.context.request.get('/');
  t.is(res1.status, 200);
  const res2 = await t.context.request.post(
    '/?_csrf=' + encodeURIComponent(res1.text)
  );
  t.is(res2.status, 200);
});

test('should be valid when token is provided via csrf-token header', async (t) => {
  const res1 = await t.context.request.get('/');
  const res2 = await t.context.request.post('/').set('csrf-token', res1.text);
  t.is(res2.status, 200);
});

test('should be valid when token is provided via xsrf-token header', async (t) => {
  const res1 = await t.context.request.get('/');
  const res2 = await t.context.request.post('/').set('xsrf-token', res1.text);
  t.is(res2.status, 200);
});

test('should be valid when token is provided via x-csrf-token header', async (t) => {
  const res1 = await t.context.request.get('/');
  const res2 = await t.context.request.post('/').set('x-csrf-token', res1.text);
  t.is(res2.status, 200);
});

test('should be valid when token is provided via x-xsrf-token header', async (t) => {
  const res1 = await t.context.request.get('/');
  const res2 = await t.context.request.post('/').set('x-xsrf-token', res1.text);
  t.is(res2.status, 200);
});

test('should not respect the _csrf querystring given disableQuery=true', async (t) => {
  const res1 = await t.context.requestWithOpts.get('/');
  const res2 = await t.context.requestWithOpts.post(
    '/?_csrf=' + encodeURIComponent(res1.text)
  );
  t.is(res2.status, 403);
  t.is(res2.text, 'Invalid CSRF token');
});

test('should ignore CSRF validation when ignoredPathGlobs matches', async (t) => {
  await t.context.requestWithOpts.get('/');
  await t.context.requestWithOpts.post('/beep');
  const res = await t.context.requestWithOpts.post('/boop');
  t.is(res.status, 403);
  t.is(res.text, 'Invalid CSRF token');
});

function getApp(opts = {}) {
  const app = new Koa();
  app.keys = ['a', 'b'];
  app.use(session());
  app.use(bodyParser());
  app.use(new CSRF(opts));
  app.use((ctx, next) => {
    if (!['GET', 'POST'].includes(ctx.method)) return next();
    if (ctx.method === 'GET') {
      ctx.body = ctx.state._csrf;
      return;
    }

    ctx.body = 'OK';
  });
  return supertest.agent(app.listen());
}
