const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models');

// Helper function to set JWT in cookie
const setUserToken = (res, user) => {
  const payload = {
    shortId: user.shortId,
    email: user.email,
    name: user.name,
    _id: user._id,
    passwordReset: user.passwordReset,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  // Set cookie expiration time (maxAge requires milliseconds)
  // Perhitungan: 24 (jam) * 60 (menit) * 60 (detik) * 1000 (milidetik) = 1 hari (86.400.000 ms)
  res.cookie('token', token, {
    // maxAge: 5 * 1000,           // test hanya 5 detik
    maxAge: 24 * 60 * 60 * 1000, // Production
    httpOnly: true,             // cookies tidak dapat diakses via JavaScript client-side (keamanan)
    secure: false,              // set ke true jika menggunakan HTTPS
    sameSite: 'lax'             // melindungi dari serangan CSRF
  });
};

// GET login page
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/login', { title: 'Login' });
});

// POST login request (Local Strategy)
router.post('/login', passport.authenticate('local', { session: false, failureRedirect: '/auth/login' }), (req, res) => {
  setUserToken(res, req.user);

  // Prompt the user to change the password upon first login if passwordReset is true
  if (req.user.passwordReset) {
    return res.redirect('/auth/update-password');
  }

  res.redirect('/');
});

// GET register page
router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/register', { title: 'Register' });
});

// POST register request
router.post('/register', async (req, res, next) => {
  const { email, name, password } = req.body;

  try {
    // Check if email already registered
    const exists = await User.findOne({ email });
    if (exists) {
      throw new Error('This email is already registered');
    }

    // Password hash value storage
    const hash = crypto.createHash('sha1').update(password).digest("hex");

    await User.create({
      email,
      name,
      password: hash,
    });

    // Redirect to main screen after joining
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// GET logout request
router.get('/logout', (req, res) => {
  // Set the token value to null, and expiration time to 0 to delete client-side cookie
  res.cookie('token', null, { maxAge: 0 });
  res.redirect('/');
});

// GET reset password request page
router.get('/reset-password', (req, res) => {
  res.render('auth/reset-password', { title: 'Reset Password' });
});

// POST reset password request (Generate arbitrary string, send via email)
const generateRandomPassword = () => {
  return Math.floor(Math.random() * (10 ** 8)).toString().padStart(8, '0');
};

router.post('/reset-password', async (req, res, next) => {
  const { email } = req.body;
  try {
    const randomPassword = generateRandomPassword();
    const pwHash = crypto.createHash('sha1').update(randomPassword).digest("hex");

    const user = await User.findOneAndUpdate(
      { email },
      { password: pwHash, passwordReset: true }, // Mark passwordReset to true
      { returnDocument: 'after' }
    );

    if (!user) {
      throw new Error('User not found.');
    }

    // Nodemailer setup
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 587,
      family: 4, // Force IPv4 to avoid DNS resolution delays in Node 17+
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const message = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: email,
      subject: "Your New Password",
      text: `Your password has been reset to: ${randomPassword}. Please log in and change it immediately.`,
    };

    transport.sendMail(message, (err, info) => {
      if (err) {
        console.error('Email err', err);
      } else {
        console.log('Email ok', info);
      }
    });

    res.redirect('/auth/login');
  } catch (err) {
    next(err);
  }
});

// GET update password page (forced after reset)
router.get('/update-password', (req, res) => {
  if (!req.user) return res.redirect('/auth/login');
  res.render('auth/update-password', { title: 'Update Password' });
});

// POST update password request
router.post('/update-password', async (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  const { password } = req.body;

  try {
    const pwHash = crypto.createHash('sha1').update(password).digest("hex");

    await User.findOneAndUpdate(
      { _id: req.user._id },
      { password: pwHash, passwordReset: false }
    );

    // We update the user token to remove passwordReset flag
    const updatedUser = await User.findById(req.user._id);
    setUserToken(res, updatedUser);

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Google OAuth Integration
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', {
  session: false, failureRedirect: '/auth/login'
}), (req, res) => {
  // If successful login, generate JWT and redirect
  setUserToken(res, req.user);
  res.redirect('/');
});

module.exports = router;
