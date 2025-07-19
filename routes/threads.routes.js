const express = require('express');
const router = express.Router();
const multer = require('multer');

// const authorize = require('../middleware/authorize.middleware')
const threadsController = require('../controllers/threads.controller');

const upload = multer();

// Create a new thread
router.post('/', threadsController.newThread);

// Get a paginated chunk of threads
router.get('/chunk', threadsController.getThreadsChunk);

// Get a single thread by ID — keep this *after* more specific routes!
router.get('/:id', threadsController.getThread);

// Update entire thread by ID
router.put('/:id', threadsController.putThread);

// Patch (partial update) thread by ID
router.patch('/:id', threadsController.patchThread);

// Delete thread by ID
router.delete('/:id', threadsController.deleteThread);

module.exports = router;
