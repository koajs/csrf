const csrf = require('csrf');

function CSRF(opts = {}) {
  const tokens = csrf(opts);

  opts = {
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
    disableQuery: false,
    ...opts
  };

  return function (ctx, next) {
    Object.defineProperty(ctx, 'csrf', {
      get() {
        if (ctx._csrf) {
          return ctx._csrf;
        }

        if (!ctx.session) {
          return null;
        }

        if (!ctx.session.secret) {
          ctx.session.secret = tokens.secretSync();
        }

        ctx._csrf = tokens.create(ctx.session.secret);

        return ctx._csrf;
      }
    });

    Object.defineProperty(ctx.response, 'csrf', {
      get: () => ctx.csrf
    });

    if (opts.excludedMethods.includes(ctx.method)) {
      return next();
    }

    if (!ctx.session.secret) {
      ctx.session.secret = tokens.secretSync();
    }

    const bodyToken =
      ctx.request.body && typeof ctx.request.body._csrf === 'string'
        ? ctx.request.body._csrf
        : false;

    const token =
      bodyToken ||
      (!opts.disableQuery && ctx.query && ctx.query._csrf) ||
      ctx.get('csrf-token') ||
      ctx.get('xsrf-token') ||
      ctx.get('x-csrf-token') ||
      ctx.get('x-xsrf-token');

    if (!token) {
      return ctx.throw(
        opts.invalidTokenStatusCode,
        typeof opts.invalidTokenMessage === 'function'
          ? opts.invalidTokenMessage(ctx)
          : opts.invalidTokenMessage
      );
    }

    if (!tokens.verify(ctx.session.secret, token)) {
      return ctx.throw(
        opts.invalidTokenStatusCode,
        typeof opts.invalidTokenMessage === 'function'
          ? opts.invalidTokenMessage(ctx)
          : opts.invalidTokenMessage
      );
    }

    return next();
  };
}

module.exports = CSRF;
