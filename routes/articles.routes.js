const express = require('express');
const router = express.Router();
const multer = require('multer');

//const authorize = require('../middleware/authorize.middleware')

const articlesController = require('../controllers/articles.controller');

const upload = multer();

// Create a new article
router.post('/', articlesController.newArticle);

// Get a single article by ID
router.get('/:id', articlesController.getArticle);

// Get a batch of articles (paginated)
router.get('/batch/list', articlesController.getBatchArticles);

// Get all articles (no pagination)
router.get('/all/list', articlesController.getAllArticles);

// Update entire article by ID
router.put('/:id', articlesController.putArticle);

// Patch (partial update) article by ID
router.patch('/:id', articlesController.patchArticle);

// Delete article by ID
router.delete('/:id', articlesController.deleteArticle);

module.exports = router;