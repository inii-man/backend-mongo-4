const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../../models');
const crypto = require('crypto');

// Utility to generate SHA1 hash (as taught in the materials)
const getHash = (password) => {
  const hash = crypto.createHash('sha1');
  hash.update(password);
  return hash.digest("hex");
};

// Configuration for local strategy
const config = {
  usernameField: 'email',
  passwordField: 'password',
};

// Local strategy implementation
const local = new LocalStrategy(config, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'The member could not be found.' });
    }
    
    // Hash provided password and compare with stored hash
    const pwHash = getHash(password);
    if (user.password !== pwHash) {
      return done(null, false, { message: 'The password does not match.' });
    }

    // Pass the authenticated user object
    done(null, {
      shortId: user.shortId,
      email: user.email,
      name: user.name,
      _id: user._id, // Add _id for DB references
      passwordReset: user.passwordReset,
    });
  } catch (err) {
    done(err, null);
  }
});

module.exports = local;
