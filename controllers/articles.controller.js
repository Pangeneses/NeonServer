const mongoose = require('mongoose');

const ArticleModel = require('../models/articles.model');
const sanitizeHtml = require('sanitize-html');

const newArticle = async (req, res) => {

  try {
    const {
      ArticleTitle,
      ArticleBody,
      ArticleImage,
      Category,
      Hashtags,
      Visible
    } = req.body;

    const Author = req.user?._id || req.body.Author;

    if (!Author) {
      return res.status(400).json({ error: 'Author is required.' });
    }

    // Sanitize ArticleBody to remove all HTML/XML/JS
    const cleanedBody = sanitizeHtml(ArticleBody, {
      allowedTags: [], // Remove all tags
      allowedAttributes: {} // Remove all attributes
    });

    if (cleanedBody.length < 500) {
      return res.status(400).json({ error: 'Article must be at least 500 characters after sanitizing.' });
    }

    const newArticle = new ArticleModel({
      Author,
      ArticleTitle,
      ArticleBody: cleanedBody,
      ArticleImage,
      Category,
      Hashtags,
      Visible
    });

    const savedArticle = await newArticle.save();
    return res.status(201).json({ message: 'Article created', article: savedArticle });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Failed to create article:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getArticle = async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Article ID' });
  }

  try {
    const Article = await ArticleModel.findById(id)
      .populate('Author', 'UserName FirstName LastName'); // Adjust fields if needed

    if (!Article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ Article });
  } catch (error) {
    console.error('Error fetching Article:', error);
    res.status(500).json({ error: 'Failed to fetch Article' });
  }
};

const getBatchArticles = async (req, res) => {
  try {
    // Default pagination settings
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Optional: filter only visible Articles
    const filter = { Visible: { $ne: false } };

    // Query
    const Articles = await ArticleModel.find(filter)
      .populate('Author', 'UserName FirstName LastName') // adjust as needed
      .sort({ CreatedDate: -1 })
      .skip(skip)
      .limit(limit);

    // Total count for pagination info
    const total = await ArticleModel.countDocuments(filter);

    res.status(200).json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalArticles: total,
      Articles
    });

  } catch (error) {
    console.error('Error fetching batch Articles:', error);
    res.status(500).json({ error: 'Failed to fetch Articles' });
  }
};

const getAllArticles = async (req, res) => {
  try {
    const Articles = await ArticleModel.find()
      .populate('Author', 'UserName FirstName LastName') // Adjust fields based on your UserModel
      .sort({ CreatedDate: -1 }); // Newest first

    res.status(200).json({ Articles });
  } catch (error) {
    console.error('Error fetching Articles:', error);
    res.status(500).json({ error: 'Failed to fetch Articles' });
  }
};

const putArticle = async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }

  try {
    // Optional: fetch existing article first (e.g., for auth check)
    const existing = await ArticleModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Destructure and sanitize updates
    const updates = { ...req.body };

    if (updates.ArticleBody) {
      const cleanedBody = sanitizeHtml(updates.ArticleBody, {
        allowedTags: [],
        allowedAttributes: {}
      });
      if (cleanedBody.length < 500) {
        return res.status(400).json({ error: 'ArticleBody must be at least 500 characters after sanitizing.' });
      }
      updates.ArticleBody = cleanedBody;
    }

    // Apply update
    const updated = await ArticleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('Author', 'UserName FirstName LastName');

    res.status(200).json({ message: 'Article updated', article: updated });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

const patchArticle = async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }

  try {
    // Find the existing article
    const existing = await ArticleModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const updates = { ...req.body };

    // Sanitize ArticleBody if included
    if (updates.ArticleBody) {
      const cleanedBody = sanitizeHtml(updates.ArticleBody, {
        allowedTags: [],
        allowedAttributes: {}
      });
      if (cleanedBody.length < 500) {
        return res.status(400).json({ error: 'ArticleBody must be at least 500 characters after sanitizing.' });
      }
      updates.ArticleBody = cleanedBody;
    }

    // Update the article partially
    const updated = await ArticleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('Author', 'UserName FirstName LastName');

    res.status(200).json({ message: 'Article updated', article: updated });
  } catch (error) {
    console.error('Error patching article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

const deleteArticle = async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }

  try {
    const deleted = await ArticleModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

module.exports = {
    newArticle,
    getAllArticles,
    getBatchArticles,
    getArticle,
    putArticle,
    patchArticle,
    deleteArticle
}