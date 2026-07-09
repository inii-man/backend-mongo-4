const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { loginRequired } = require('../middlewares/auth');

// API Creation - Comment List
// RESTful route configuration to fetch comments
router.get('/posts/:shortId/comments', async (req, res, next) => {
  const { shortId } = req.params;
  try {
    const post = await Post.findOne({ shortId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Populate author within the comments sub-documents
    await User.populate(post.comments, {
      path: 'author',
      select: 'name email shortId' // Select fields to expose
    });

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Creation - Comment Creation
// POST request to add a new comment
router.post('/posts/:shortId/comments', loginRequired, async (req, res, next) => {
  const { shortId } = req.params;
  const { content } = req.body;

  try {
    // $push is used to add comment to array
    await Post.updateOne(
      { shortId },
      { 
        $push: { 
          comments: { 
            content, 
            author: req.user._id // Using ID of logged-in user
          } 
        } 
      }
    );

    // API does not render, responds with JSON
    res.json({ result: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
