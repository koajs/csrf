import csrf from 'csrf';

export default class CSRF {
  constructor(opts) {
    this.opts = Object.assign({
      invalidSessionSecretMessage: 'Invalid session secret',
      invalidSessionSecretStatusCode: 403,
      invalidTokenMessage: 'Invalid CSRF token',
      invalidTokenStatusCode: 403,
      excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
      disableQuery: false
    }, opts);

    this.tokens = csrf(this.opts);
    return this.middleware;
  }

  middleware = (ctx, next) => {
    ctx.__defineGetter__('csrf', () => {
      if (ctx._csrf) return ctx._csrf;
      if (!ctx.session) return null;
      if (!ctx.session.secret) ctx.session.secret = this.tokens.secretSync();
      ctx._csrf = this.tokens.create(ctx.session.secret);
      return ctx._csrf;
    });

    ctx.response.__defineGetter__('csrf', () => ctx.csrf);

    if (this.opts.excludedMethods.indexOf(ctx.method) !== -1) {
      return next();
    }

    if (!ctx.session.secret) {
      ctx.session.secret = this.tokens.secretSync();
    }

    const bodyToken = (ctx.request.body && typeof ctx.request.body._csrf === 'string')
      ? ctx.request.body._csrf
      : false;

    const token = bodyToken
      || (!this.opts.disableQuery && ctx.query && ctx.query._csrf)
      || ctx.get('csrf-token')
      || ctx.get('xsrf-token')
      || ctx.get('x-csrf-token')
      || ctx.get('x-xsrf-token');

    if (!token) {
      return ctx.throw(
        this.opts.invalidTokenStatusCode,
        this.opts.invalidTokenMessage
      );
    }

    if (!this.tokens.verify(ctx.session.secret, token)) {
      return ctx.throw(
        this.opts.invalidTokenStatusCode,
        this.opts.invalidTokenMessage
      );
    }

    return next();
  }
}
