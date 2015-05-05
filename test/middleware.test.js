var should = require('should')
var supertest = require('supertest')
var koa = require('koa')
var sessions = require('koa-session')
var parse = require('co-body')

var csrf = require('../')

var tokenregexp = /^\w+-[\w+\/]+/

describe('CSRF Token Middleware', function () {
  var app = App()

  app.use(function* (next) {
    if (this.path !== '/')
      return yield next

    if (this.method === 'GET') {
      this.body = this.csrf
    } else if (this.method === 'POST') {
      this.status = 204
    }
  })

  var request = supertest.agent(app.listen())

  var csrf

  describe('should create', function () {
    it('a token', function (done) {
      request
      .get('/')
      .expect(200)
      .expect(tokenregexp)
      .end(function (err, res) {
        if (err)
          return done(err)

        csrf = res.text
        done()
      })
    })

    it('a single token per request', function (done) {
      app.use(function* (next) {
        if (this.path !== '/asdf')
          return yield next
        this.csrf.should.equal(this.csrf)
        this.status = 204
      })

      supertest(app.listen())
      .get('/asdf')
      .expect(204, done)
    })

    it('a new token per request', function (done) {
      request
      .get('/')
      .expect(200)
      .expect(tokenregexp)
      .end(function (err, res) {
        if (err)
          return done(err)

        csrf.should.not.equal(res.text)
        done()
      })
    })

    it('a null token when session is invalid', function (done) {
      app.use(function* (next) {
        if (this.path !== '/reset')
          return yield next
        this.session = null
        this.status = 204
        should(this.csrf).not.be.ok
      })

      supertest(app.listen())
      .get('/reset')
      .expect(204, done)
    })
  })

  describe('should assert', function () {
    it('when no token is supplied', function (done) {
      request
      .post('/')
      .expect(403, done)
    })
  })

  describe('should not assert when the token is supplied via', function () {
    it('json body', function (done) {
      request
      .post('/')
      .send({
        _csrf: csrf
      })
      .expect(204, done)
    })

    it('querystring', function (done) {
      request
      .post('/?_csrf=' + encodeURIComponent(csrf))
      .expect(204, done)
    })

    it('querystring with body', function (done) {
      request
      .post('/?_csrf=' + encodeURIComponent(csrf))
      .send({ foo: 'bar' })
      .expect(204, done)
    })

    it('x-csrf-token', function (done) {
      request
      .post('/')
      .set('x-csrf-token', csrf)
      .expect(204, done)
    })

    it('x-xsrf-token', function (done) {
      request
      .post('/')
      .set('x-xsrf-token', csrf)
      .expect(204, done)
    })
  })
})

function App() {
  var app = koa()
  app.keys = ['a', 'b']
  app.use(sessions())

  app.use(function *(next) {
    if (this.is('application/json', 'application/x-www-form-urlencoded'))
      this.request.body = yield parse(this)
    yield* next
  })

  app.use(csrf())
  return app
}
