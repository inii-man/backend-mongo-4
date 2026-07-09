const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../../models');

const config = {
  clientID: process.env.GOOGLE_CLIENT_ID || 'your_client_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
};

const google = new GoogleStrategy(config, async (accessToken, refreshToken, profile, done) => {
  try {
    // The profile includes user info like email and name
    const { email, name } = profile._json;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user does not exist, create a new one.
      // We generate a random password for OAuth users because they don't have one in our system
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha1').update(randomPassword).digest('hex');

      user = await User.create({
        email,
        name,
        password: hash,
      });
    }

    // Pass the user object to Passport
    done(null, {
      shortId: user.shortId,
      email: user.email,
      name: user.name,
      _id: user._id,
      passwordReset: user.passwordReset,
    });
  } catch (error) {
    done(error, null);
  }
});

module.exports = google;
