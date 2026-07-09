const passport = require('passport');

// Middleware to inject user into req/res if JWT is present in cookies
// This will process every request and attempt to authenticate using JWT.
// It will not throw an error if unauthenticated, just leaves req.user undefined.
exports.checkAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (user) {
      req.user = user;
      // Also attach to locals so Pug templates can access `user`
      res.locals.user = user;
    }
    next();
  })(req, res, next);
};

// Middleware to protect specific routes that require login
exports.loginRequired = (req, res, next) => {
  if (!req.user) {
    // If not logged in, redirect to login page
    res.redirect('/auth/login');
    return;
  }
  next();
};
