const mongoose = require('mongoose');
const { Schema } = mongoose;
const { nanoid } = require('nanoid');

// Comment sub-schema
const CommentSchema = new Schema({
  content: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt for comments
});

// Post schema
const PostSchema = new Schema({
  shortId: {
    type: String,
    default: () => nanoid(), // Generate a string without duplicates using nanoid
    require: true,
    index: true, // Create an index for faster queries on shortId
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
    index: true, // Create an index on author to optimize $match and lookups (aggregation)
  },
  comments: [CommentSchema], // Array of sub-documents for comments
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt for posts
});

module.exports = mongoose.model('Post', PostSchema);
