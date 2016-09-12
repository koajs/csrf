
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import session from 'koa-generic-session';
import convert from 'koa-convert';
import supertest from 'supertest';

import CSRF from '../../';
const tokenRegExp = /^\w+-[\w+\/-]+/;

describe('CSRF token', () => {

  let app;
  let request;

  before(done => {
    app = new Koa();
    app.keys = [ 'a', 'b' ];
    app.use(convert(session()));
    app.use(bodyParser());
    app.use(new CSRF());
    app.use((ctx, next) => {
      if (!([ 'GET', 'POST' ].includes(ctx.method)))
        return next();
      if (ctx.method === 'GET') {
        ctx.body = ctx.csrf;
        return;
      }
      ctx.body = 'OK';
    });
    request = supertest.agent(app.listen(done));
  });

  it('should create a token', done => {
    request.get('/')
      .expect(200)
      .expect(tokenRegExp)
      .end(done);
  });

  it('should create a new token every request', done => {
    request.get('/')
      .expect(200)
      .expect(tokenRegExp)
      .end((err, res1) => {
        if (err) return done(err);
        request.get('/')
          .expect(tokenRegExp)
          .end((err, res2) => {
            if (err) return done(err);
            expect(res1.text).to.not.equal(res2.text);
            done();
          });
      });
  });

});
