const passport = require('passport');
const local = require('./strategies/local');
const jwt = require('./strategies/jwt');
const google = require('./strategies/google');
const { User } = require('../models');

module.exports = () => {
  // Register strategies
  passport.use(local);
  passport.use(jwt);
  passport.use(google);

  // serializeUser and deserializeUser are used when implementing Session-based login
  // They determine what user data is stored in the session and how to retrieve it.
  
  passport.serializeUser((user, done) => {
    // Minimization of user information stored in the session
    done(null, {
      shortId: user.shortId,
      email: user.email,
      name: user.name,
      _id: user._id, // Adding Object ID for populate in posts
    });
  });

  passport.deserializeUser((obj, done) => {
    // When using sessions, this takes the session object and converts it to req.user
    // Usually you'd fetch the latest user from DB here, but to minimize DB load,
    // we just return the object stored in session if we trust it.
    done(null, obj);
  });
};
