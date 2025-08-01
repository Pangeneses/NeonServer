const mongoose = require('mongoose');

const ArticleModel = require('../models/articles.model');

const sanitizers = require('../services/sanitizer.service')

const newArticle = async (req, res) => {

  console.log('Received article POST body:', req.body);

  try {

    const {
      ArticleUserID,
      ArticleTitle,
      ArticleBody,
      ArticleImage,
      ArticleCategory,
      ArticleHashtags,
      ArticleVisibility
    } = req.body;

    if (!ArticleUserID) {

      return res.status(400).json({ error: 'User ID is required.' });

    }

    try {

      sanitizers.validateHashtags({ ArticleHashtags: ArticleHashtags || [] });

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    try {

      const cleanedCategory = ArticleCategory.replace(/[\s_]/g, '');

      sanitizers.validateCategory(cleanedCategory);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    try {

      sanitizers.validateImageFilename(ArticleImage);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    const cleanedBody = sanitizers.sanitizeBodyFull(ArticleBody);

    const he = require('he'); 
    const plainText = cleanedBody.replace(/<[^>]*>/g, '');
    const decodedText = he.decode(plainText); 
    const charCount = decodedText.trim().length;

    if (!cleanedBody || 500 > charCount.length) {

      return res.status(400).json({

        error: 'Article must be at least 500 Characters.'

      });

    }

    const newArticle = new ArticleModel({
      ArticleUserID,
      ArticleTitle,
      ArticleBody: cleanedBody,
      ArticleImage,
      ArticleCategory: cleanedCategory,
      ArticleHashtags,
      ArticleVisibility
    });

    const savedArticle = await newArticle.save();

    const formatted = {
      ...savedArticle.toObject(),
      ArticleID: savedArticle._id.toString(),
      ArticleCategory: sanitizers.insertSpacesBetweenLowerUpper(savedArticle.ArticleCategory),
    };

    return res.status(201).json({
      message: 'Article created',
      Article: formatted
    });

  } catch (error) {

    if (error.name === 'ValidationError') {

      return res.status(400).json({

        error: 'Validation failed',

        details: error.errors

      });

    }

    console.error('Failed to create article:', error);

    return res.status(500).json({ error: 'Internal server error' });

  }

};

const getArticle = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid Article ID' });

  }

  try {

    const Article = await ArticleModel.findById(id)
      .populate('ArticleUserID');

    if (!Article) {

      return res.status(404).json({ error: 'Article not found' });

    }

    const formatted = {
      ...Article.toObject(),
      ArticleID: Article._id.toString(),
      ArticleCategory: sanitizers.insertSpacesBetweenLowerUpper(Article.ArticleCategory)
    };

    res.status(200).json({ Article: formatted });

  } catch (error) {

    console.error('Error fetching Article:', error);

    res.status(500).json({ error: 'Failed to fetch Article' });

  }

};

const getArticleChunk = async (req, res) => {

  try {

    let {
      limit,
      lastID,
      direction = 'down',
      ArticleUserID,
      ArticleCategory,
      ArticleHashtags,
      ArticleFrom,
      ArticleTo
    } = req.query;

    console.log('GET /chunk received with query:', req.query);

    const filter = {};

    if (typeof ArticleUserID === 'string' && ArticleUserID.trim() !== '') {

      filter.ArticleUserID = ArticleUserID;

    }


    if (
      typeof ArticleCategory === 'string' &&
      ArticleCategory.trim() !== '' &&
      ArticleCategory !== 'Unspecified'
    ) {

      const normalizedCategory = ArticleCategory.replace(/[\s_]/g, '');

      if (/^[a-zA-Z]+$/.test(normalizedCategory)) {

        filter.ArticleCategory = normalizedCategory;

      }

    }

    if (typeof ArticleHashtags === 'string') {

      ArticleHashtags = [ArticleHashtags];

    }

    if (
      Array.isArray(ArticleHashtags) &&
      ArticleHashtags.length > 0 &&
      ArticleHashtags.some(tag => typeof tag === 'string' && tag.trim() !== '')
    ) {

      filter.ArticleHashtags = { $in: ArticleHashtags };

    }

    console.log(ArticleFrom + ' ' + ArticleTo);

    if (
      typeof ArticleFrom === 'string' &&
      typeof ArticleTo === 'string' &&
      !isNaN(Date.parse(ArticleFrom)) &&
      !isNaN(Date.parse(ArticleTo))
    ) {

      filter.ArticleDate = {
        $gte: new Date(ArticleFrom),
        $lte: new Date(ArticleTo),
      };

    }

    const chunkLimit = Math.min(parseInt(limit) || 10, 100);

    direction = direction === 'up' ? 'up' : 'down';

    if (lastID && mongoose.Types.ObjectId.isValid(lastID)) {

      const op = direction === 'up' ? '$gt' : '$lt';

      filter._id = { [op]: new mongoose.Types.ObjectId(lastID) };

    }

    const sortOrder = direction === 'up' ? 1 : -1;

    console.log(filter);

    const Articles = await ArticleModel.find(filter)
      .populate('ArticleUserID')
      .sort({ _id: sortOrder })
      .limit(chunkLimit);

    console.log(Articles);

    const formatted = Articles.map(article => {

      const obj = article.toObject();

      return {
        ...obj,
        ArticleID: obj._id.toString(), 
        ArticleCategory: sanitizers.insertSpacesBetweenLowerUpper(obj.ArticleCategory),
      };

    });

    return res.status(200).json({ Articles: formatted });

  } catch (error) {

    console.error('Error fetching article chunk:', error);

    return res.status(500).json({ error: 'Failed to fetch article chunk' });

  }

};

const putArticle = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid article ID' });

  }

  try {

    const existing = await ArticleModel.findById(id);

    if (!existing) {

      return res.status(404).json({ error: 'Article not found' });

    }

    const updates = { ...req.body };

    try {

      validateHashtags({ ArticleHashtags: updates.ArticleHashtags || [] });

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    try {

      validateCategory(updates.ArticleCategory);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    try {

      validateImageFilename(updates.ArticleImage);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    if (updates.ArticleBody) {

      const cleanedBody = sanitizers.sanitizeBodyFull(updates.ArticleBody);

      const he = require('he'); 
      const plainText = cleanedBody.replace(/<[^>]*>/g, '');
      const decodedText = he.decode(plainText); 
      const charCount = decodedText.trim().length;

      console.log(cleanedBody)

      if (!cleanedBody || 500 > charCount.length) {

        return res.status(400).json({

          error: 'Article must be at least 500 Characters.'

        });

      }

      updates.ArticleBody = cleanedBody;

    }

    const updated = await ArticleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('ArticleUserID');

    const formatted = {
      ...updated.toObject(),
      ArticleID: updated._id.toString(),
      ArticleCategory: sanitizers.insertSpacesBetweenLowerUpper(updated.ArticleCategory)
    };

    res.status(200).json({ message: 'Article updated', Article: formatted });

  } catch (error) {

    console.error('Error updating article:', error);

    res.status(500).json({ error: 'Failed to update article' });

  }

};

const patchArticle = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid article ID' });

  }

  try {

    const existing = await ArticleModel.findById(id);

    if (!existing) {

      return res.status(404).json({ error: 'Article not found' });

    }

    const updates = { ...req.body };

    try {

      validateHashtags({ ArticleHashtags: updates.ArticleHashtags || [] });

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    try {
      
      validateCategory(updates.ArticleCategory);
    
    } catch (e) {
    
      return res.status(400).json({ error: e.message });
    
    }

    try {
    
      validateImageFilename(updates.ArticleImage);
    
    } catch (e) {
    
      return res.status(400).json({ error: e.message });
    
    }

    if (updates.ArticleBody) {

      const cleanedBody = sanitizers.sanitizeBodyFull(updates.ArticleBody);
      
      const he = require('he'); 
      const plainText = cleanedBody.replace(/<[^>]*>/g, '');
      const decodedText = he.decode(plainText); 
      const charCount = decodedText.trim().length;
      
      console.log(cleanedBody)
      
      if (!cleanedBody || 500 > charCount.length) {
      
        return res.status(400).json({
        
          error: 'Article must be at least 500 Characters.'
        
        });
      
      }

      updates.ArticleBody = cleanedBody;

    }

    const updated = await ArticleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('ArticleUserID');

    const formatted = {
      ...updated.toObject(),
      ArticleID: updated._id.toString(),
      ArticleCategory: sanitizers.insertSpacesBetweenLowerUpper(updated.ArticleCategory)
    };

    res.status(200).json({ message: 'Article updated', Article: formatted });

  } catch (error) {

    console.error('Error patching article:', error);

    res.status(500).json({ error: 'Failed to update article' });

  }

};

const deleteArticle = async (req, res) => {

  const { id } = req.params;

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
  getArticleChunk,
  getArticle,
  putArticle,
  patchArticle,
  deleteArticle
}