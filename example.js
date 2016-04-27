var koa = require('koa')
var csrf = require('./')
var session = require('koa-session')

var app = koa()
app.keys = ['session secret']
session(app)
app.use(csrf())

app.use(function* () {
  if (this.method === 'GET') {
    this.body = this.csrf
  } else if (this.method === 'POST') {
    this.status = 204
  }
})

app.listen(3000)
