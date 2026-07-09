const mongoose = require('mongoose');
const User = require('./user');
const Post = require('./post');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/playground', {
  // Options to handle deprecation warnings (some are deprecated in newer mongoose but good practice to show)
})
.then(() => {
  console.log('MongoDB connection successful!');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = {
  User,
  Post,
};
