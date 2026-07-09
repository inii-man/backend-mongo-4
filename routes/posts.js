const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { loginRequired } = require('../middlewares/auth');

// GET posts list with pagination
router.get('/', async (req, res, next) => {
  // If the query has write=true, render the edit form for creation
  if (req.query.write) {
    if (!req.user) return res.redirect('/auth/login');
    return res.render('posts/edit', { title: 'Create Post' });
  }

  try {
    // Pagination parameters
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 10);

    const total = await Post.countDocuments({});
    
    // Retrieve paginated data
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('author'); // Populate author from user reference

    const totalPage = Math.ceil(total / perPage);

    res.render('posts/list', { 
      title: 'Posts List', 
      posts, 
      page, 
      perPage, 
      totalPage,
      path: '/posts'
    });
  } catch (err) {
    next(err);
  }
});

// GET specific post detail
router.get('/:shortId', async (req, res, next) => {
  const { shortId } = req.params;

  // Handle edit mode for existing post
  if (req.query.edit) {
    if (!req.user) return res.redirect('/auth/login');
    try {
      const post = await Post.findOne({ shortId }).populate('author');
      if (!post) {
        return next(new Error('Post NotFound'));
      }
      
      // Verify author matches logged-in user
      if (post.author._id.toString() !== req.user._id.toString()) {
        throw new Error('Not Authorized');
      }

      return res.render('posts/edit', { title: 'Edit Post', post });
    } catch (err) {
      return next(err);
    }
  }

  try {
    // Fetch post and populate author
    const post = await Post.findOne({ shortId }).populate('author');
    if (!post) {
      return next(new Error('Post NotFound'));
    }

    res.render('posts/view', { title: post.title, post });
  } catch (err) {
    next(err);
  }
});

// POST to create a new post
router.post('/', loginRequired, async (req, res, next) => {
  const { title, content } = req.body;
  try {
    // req.user has _id since we injected it via JWT
    await Post.create({
      title,
      content,
      author: req.user._id,
    });
    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

// POST to update an existing post (Form POST only supports GET/POST, so we use POST for update here)
router.post('/:shortId', loginRequired, async (req, res, next) => {
  const { shortId } = req.params;
  const { title, content } = req.body;
  
  try {
    // First, fetch the post to verify ownership
    const post = await Post.findOne({ shortId }).populate('author');
    if (!post) {
      return next(new Error('Post NotFound'));
    }
    if (post.author._id.toString() !== req.user._id.toString()) {
      throw new Error('Not Authorized');
    }

    // Update
    await Post.findOneAndUpdate(
      { shortId },
      { title, content }
    );
    res.redirect(`/posts/${shortId}`);
  } catch (err) {
    next(err);
  }
});

// DELETE a post
router.delete('/:shortId', loginRequired, async (req, res, next) => {
  const { shortId } = req.params;
  try {
    const post = await Post.findOne({ shortId }).populate('author');
    if (!post) {
      return next(new Error('Post NotFound'));
    }
    if (post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not Authorized' });
    }

    await Post.deleteOne({ shortId });
    res.send('OK');
  } catch (err) {
    next(err);
  }
});

// MongoDB Aggregation Example: Fetch author's posts summary
router.get('/author/:authorId/summary', async (req, res, next) => {
  try {
    const { authorId } = req.params;
    
    // Convert string ID to mongoose ObjectId for matching
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(authorId);

    // Simple Aggregation example
    const summary = await Post.aggregate([
      // Stage 1: Match posts by specific author
      { $match: { author: objectId } },
      // Stage 2: Group by author and sum up
      { $group: { _id: '$author', count: { $sum: 1 } } },
      // Stage 3: Lookup user data from 'users' collection
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'authorData' } }
    ]);

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
