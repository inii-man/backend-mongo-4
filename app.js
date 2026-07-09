require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

// Import configurations
require('./models'); // Connect to MongoDB
require('./passport')(); // Configure Passport strategies

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');
const apiRouter = require('./routes/api');

const app = express();

// Set Pug as the template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Parse cookies, important for JWT in cookies

// --- SESSION CONFIGURATION (Commented out per course instruction to switch to JWT) ---
// If you want to use session instead of JWT, uncomment this block:
/*
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/playground',
  }),
}));
*/

// Initialize Passport
app.use(passport.initialize());
// app.use(passport.session()); // Only needed if using session-based auth

// Global variables for templates (app.locals)
app.locals.appName = 'Playground Express';
const dayjs = require('dayjs');
app.locals.formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');

// Attach user to res.locals so templates can render dynamic login/logout buttons
// We use a custom middleware to verify JWT token and inject user into req/res
const { checkAuth } = require('./middlewares/auth');
app.use(checkAuth); 

// Route assignments
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use('/api', apiRouter); // For CSR comments

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! ' + err.message);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
