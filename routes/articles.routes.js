const express = require('express');
const router = express.Router();

// const authorize = require('../middleware/authorize.middleware')
const articlesController = require('../controllers/articles.controller');

// Create a new article
router.post('/', articlesController.newArticle);

// Get a paginated chunk of articles
router.get('/chunk', articlesController.getArticleChunk);

// Get a single article by ID — keep this *after* more specific routes!
router.get('/:id', articlesController.getArticle);

// Update entire article by ID
router.put('/:id', articlesController.putArticle);

// Patch (partial update) article by ID
router.patch('/:id', articlesController.patchArticle);

// Delete article by ID
router.delete('/:id', articlesController.deleteArticle);

module.exports = router;
