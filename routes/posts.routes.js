const express = require('express');
const router = express.Router();

// const authorize = require('../middleware/authorize.middleware')
const postsController = require('../controllers/posts.controller');

// Get thread posts
router.post('/', postsController.newPost);

// Get thread posts
router.get('/batch', postsController.getBatch);

module.exports = router;
