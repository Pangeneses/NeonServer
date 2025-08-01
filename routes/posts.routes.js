const express = require('express');
const router = express.Router();

// const authorize = require('../middleware/authorize.middleware')
const postsController = require('../controllers/posts.controller');

// Append post to post in post
router.post('/', postsController.newThread);

// Get a paginated chunk of posts in post
router.get('/chunk', postsController.getPostsChunk);

module.exports = router;
