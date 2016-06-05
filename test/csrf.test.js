var supertest = require('supertest')
var should = require('should');
var koa = require('koa')
var sessions = require('koa-session')
var parse = require('co-body')

var csrf = require('../')

var tokenregexp = /^\w+-[\w+\/-]+/

describe('CSRF Token', function () {
  var app = App()

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
        this.response.csrf.should.equal(this.csrf)
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
  })

  describe('should assert', function () {
    it('when no token is supplied', function (done) {
      request
      .post('/')
      .expect(403, function(err, res) {
        should.not.exists(err)
        res.text.should.eql('token is missing')
        done()
      })
    })

    it('when no secret is supplied', function (done) {
      supertest(app.listen())
      .post('/')
      .expect(403, function(err, res) {
        should.not.exists(err)
        res.text.should.eql('secret is missing')
        done()
      })
    })

    it('when invalid csrf token', function (done) {
      request
      .post('/')
      .send({
        _csrf: 'wrong csrf token'
      })
      .expect(403, function(err, res) {
        should.not.exists(err)
        res.text.should.eql('invalid csrf token')
        done()
      })
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

  describe('.assertCSRF()', function () {
    it('should support a string value', function (done) {
      request
      .post('/string')
      .send({
        _csrf: csrf
      })
      .expect(204, done);
    })
  })
})

function App() {
  var app = koa()
  app.keys = ['a', 'b']
  csrf(app)
  app.use(sessions(app))
  app.use(function* (next) {
    if (this.path !== '/' && this.path !== '/string') return yield* next

    if (this.method === 'GET') {
      this.body = this.csrf
    } else if (this.method === 'POST') {
      var body
      try {
        body = yield parse(this)
      } catch (err) {}
      if (this.path === '/string') this.assertCSRF(body._csrf)
      else this.request.assertCSRF(body)
      this.status = 204
    }
  })
  return app
}
