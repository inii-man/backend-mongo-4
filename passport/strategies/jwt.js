const JwtStrategy = require('passport-jwt').Strategy;

// Custom extractor to get token from cookies
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token; // Read token from 'token' cookie
  }
  return token;
};

const opts = {
  // Use the secret defined in env, fallback to 'secret'
  secretOrKey: process.env.JWT_SECRET || 'secret',
  jwtFromRequest: cookieExtractor,
};

// JWT Strategy implementation
const jwt = new JwtStrategy(opts, (jwt_payload, done) => {
  // jwt_payload contains the decoded data (user object)
  // We can choose to verify it with DB, but for speed, we just trust the signature.
  done(null, jwt_payload);
});

module.exports = jwt;
