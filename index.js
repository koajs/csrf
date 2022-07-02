const csrf = require('csrf');
const isSANB = require('is-string-and-not-blank');
const multimatch = require('multimatch');

function CSRF(opts = {}) {
  const tokens = csrf(opts);

  opts = {
    errorHandler(ctx) {
      return ctx.throw(403, 'Invalid CSRF token');
    },
    excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
    disableQuery: false,
    ignoredPathGlobs: [],
    ...opts
  };

  // eslint-disable-next-line complexity
  return async function (ctx, next) {
    if (!ctx.session) return next();

    if (!ctx.session.secret) ctx.session.secret = await tokens.secret();

    if (!ctx.state._csrf) ctx.state._csrf = tokens.create(ctx.session.secret);

    if (opts.excludedMethods.includes(ctx.method)) return next();

    // check against ignored/whitelisted redirect middleware paths
    if (
      Array.isArray(opts.ignoredPathGlobs) &&
      opts.ignoredPathGlobs.length > 0
    ) {
      const match = multimatch(ctx.path, opts.ignoredPathGlobs);
      if (Array.isArray(match) && match.length > 0) return next();
    }

    const bodyToken = isSANB(ctx.request.body._csrf)
      ? ctx.request.body._csrf
      : false;

    const queryToken =
      !bodyToken && !opts.disableQuery && ctx.query && isSANB(ctx.query._csrf)
        ? ctx.query._csrf
        : false;

    const token =
      bodyToken ||
      queryToken ||
      ctx.get('csrf-token') ||
      ctx.get('xsrf-token') ||
      ctx.get('x-csrf-token') ||
      ctx.get('x-xsrf-token');

    if (!token || !tokens.verify(ctx.session.secret, token))
      return opts.errorHandler(ctx);

    return next();
  };
}

module.exports = CSRF;
