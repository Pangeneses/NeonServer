const express = require('express');
const router = express.Router();

// const authorize = require('../middleware/authorize.middleware')
const threadsController = require('../controllers/threads.controller');

// Get a paginated chunk of threads
router.get('/chunk', threadsController.getThreadChunk);

// Get a single thread by ID — keep this *after* more specific routes!
router.get('/:id', threadsController.getThread);

module.exports = router;
