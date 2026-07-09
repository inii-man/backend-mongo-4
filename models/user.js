const mongoose = require('mongoose');
const { Schema } = mongoose;
const { nanoid } = require('nanoid');

const UserSchema = new Schema({
  shortId: {
    type: String,
    default: () => nanoid(), // Short ID generated using nanoid
    require: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Email must be unique
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true, // Storing hashed password (sha1 as taught)
  },
  passwordReset: {
    type: Boolean,
    default: false, // Flag used when user requests password reset
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
