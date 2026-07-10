const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  // Renders the index.pug view
  // Notice we don't need to pass 'user' because checkAuth middleware put it in res.locals
  res.render('index', { title: 'Welcome to Playground Express' });
});

module.exports = router;
