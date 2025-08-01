const mongoose = require('mongoose');

const ThreadModel = require('../models/threads.model');
const PostModel = require('../models/post.model');

const sanitizers = require('../services/sanitizer.service')

const newThread = async (req, res) => {

  console.log('Received thread POST body:', req.body);

  try {

    let {
      ThreadUserID,
      ThreadTitle,
      ThreadImage,
      ThreadDate,
      ThreadAccess,
      ThreadCategory,
      ThreadHashtags,
      ThreadPost,
      ThreadVisibility
    } = req.body;

    // Set default image if none provided
    if (!ThreadImage || ThreadImage.trim() === '') {

      ThreadImage = 'd741b779-9c57-472a-a983-5c1dcaef7426.webp';

    }

    // Validate ThreadUserID
    if (!ThreadUserID || !mongoose.Types.ObjectId.isValid(ThreadUserID)) {

      return res.status(400).json({ error: 'Valid ThreadUserID is required.' });

    }

    // Validate image filename
    try {

      sanitizers.validateImageFilename(ThreadImage);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    // Validate ThreadAccess: number between 3 and 60
    if (typeof ThreadAccess !== 'number' || ThreadAccess < 0 || ThreadAccess > 60) {

      return res.status(400).json({ error: 'ThreadAccess must be a number between 0 and 60 (months).' });

    }

    // Validate and clean category
    let cleanedCategory = '';

    try {

      cleanedCategory = ThreadCategory.replace(/\s|_/g, '');

      sanitizers.validateCategory(cleanedCategory);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    // Validate hashtags
    try {

      sanitizers.validateHashtags({ ThreadHashtags: ThreadHashtags || [] });

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    // Sanitize ThreadPost (which is body of first post)
    let cleanedBody = sanitizers.sanitizeBodyFull(ThreadPost);

    const he = require('he'); 
    const plainText = cleanedBody.replace(/<[^>]*>/g, '');
    const decodedText = he.decode(plainText); 
    const charCount = decodedText.trim().length;

    console.log(cleanedBody)

    if (!cleanedBody || 100 > charCount.length) {

      return res.status(400).json({

        error: 'ThreadPost must be at least 150.'

      });

    }

    if (!cleanedBody || charCount.length > 1000) {

      return res.status(400).json({

        error: 'ThreadPost must be less than 3000 characters.'

      });

    }

    console.log(cleanedBody)

    // Create new Post
    let newPost = new PostModel({
      PostUserID: req.body.PostUserID,
      PostContent: cleanedBody,
      PostDate: ThreadDate || Date.now(),
      PostToPost: null,
      PostToThread: null,
      PostVisibility: true
    });

    const savedPost = await newPost.save();

    // Create new Thread
    const newThread = new ThreadModel({
      ThreadUserID,
      ThreadTitle,
      ThreadImage,
      ThreadDate: ThreadDate || Date.now(),
      ThreadAccess,
      ThreadCategory: cleanedCategory,
      ThreadHashtags,
      ThreadPosts: [savedPost._id],
      ThreadVisibility: ThreadVisibility !== undefined ? ThreadVisibility : true
    });

    savedThread.ThreadPosts = [newPost._id];

    let savedThread = await newThread.save();

    if (!mongoose.Types.ObjectId.isValid(newPost._id)) {

      throw new Error('Invalid ID');

    } else {
        
        newPost.PostToThread = [savedThread._id];
    
        newPost = await PostModel.findByIdAndUpdate(newPost._id, newPost, { new: true });
    
    }

    const formatted = {
      ...savedThread.toObject(),
      ThreadID: savedThread._id.toString(),
      ThreadCategory: sanitizers.insertSpacesBetweenLowerUpper(savedThread.ThreadCategory)
    };

    return res.status(201).json({
      message: 'Thread created',
      Thread: formatted
    });

  } catch (error) {

    if (error.name === 'ValidationError') {

      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });

    }

    console.error('Failed to create thread:', error);

    return res.status(500).json({ error: 'Internal server error' });

  }

};

const newPost = async (req, res) => {

  console.log('Received thread POST body:', req.body);

  try {

    const {
      ThreadUserID,
      ThreadID,
      PostDate,
      PostBody,
      PostVisibility
    } = req.body;

    // Validate ThreadUserID
    if (!ThreadUserID || !mongoose.Types.ObjectId.isValid(ThreadUserID)) {

      return res.status(400).json({ error: 'Valid ThreadUserID is required.' });

    }

    // Validate ThreadID
    if (!ThreadID || !mongoose.Types.ObjectId.isValid(ThreadID)) {

      return res.status(400).json({ error: 'Valid ThreadID is required.' });

    }

    // Validate image filename
    try {

      sanitizers.validateImageFilename(ThreadImage);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

    // Sanitize Appended Post
    const cleanedBody = sanitizers.sanitizeBodyFull(PostBody);

    const he = require('he'); 
    const plainText = cleanedBody.replace(/<[^>]*>/g, '');
    const decodedText = he.decode(plainText); 
    const charCount = decodedText.trim().length;

    console.log(cleanedBody)

    if (!cleanedBody || 100 > charCount.length) {

      return res.status(400).json({

        error: 'ThreadPost must be at least 150.'

      });

    }

    if (!cleanedBody || charCount.length > 1000) {

      return res.status(400).json({

        error: 'ThreadPost must be less than 3000 characters.'

      });

    }

    // Get the last post in the thread's Posts array
    const thread = await ThreadModel.findById(ThreadID).select('Posts');

    if (!thread) {

      return res.status(404).json({ error: 'Thread not found.' });
      
    }

    const lastPostId = thread.Posts.length > 0
      ? thread.Posts[thread.Posts.length - 1]
      : null;

    // Create new Post
    const newPost = new PostModel({
      ThreadUserID,
      PostBody: cleanedBody,
      PostDate: PostDate || Date.now(),
      PostToPost: lastPostId,
      PostToThread: ThreadID,
      PostVisibility: PostVisibility !== undefined ? PostVisibility : true
    });

    const savedPost = await newPost.save();

    thread.Posts.push(savedPost._id);
    await thread.save();

    const formatted = {
      ...savedPost.toObject(),
      PostID: savedPost._id.toString()
    };

    return res.status(201).json({
      message: 'Post appended',
      Thread: formatted
    });

  } catch (error) {

    if (error.name === 'ValidationError') {

      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });

    }

    console.error('Failed to create post:', error);

    return res.status(500).json({ error: 'Internal server error' });

  }

};

const getPostsChunk = async (req, res) => {

  try {

    const { threadId, lastId, direction = 'down', limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {

      return res.status(400).json({ error: 'Invalid threadId.' });

    }

    const thread = await ThreadModel.findById(threadId).lean();

    if (!thread) {

      return res.status(404).json({ error: 'Thread not found.' });

    }

    const postIds = thread.ThreadPosts.map(id => id.toString());

    if (postIds.length === 0) {

      return res.status(200).json({ Posts: [] });

    }

    const index = lastId
      ? postIds.indexOf(lastId)
      : direction === 'up'
      ? postIds.length
      : -1;

    let sliceStart, sliceEnd;

    if (direction === 'up') {

      sliceStart = Math.max(index - parseInt(limit), 0);

      sliceEnd = index;

    } else {

      sliceStart = index + 1;

      sliceEnd = Math.min(index + 1 + parseInt(limit), postIds.length);

    }

    const chunkIds = postIds.slice(sliceStart, sliceEnd);

    const posts = await PostModel.find({ _id: { $in: chunkIds } })
      .populate('ThreadUserID')
      .lean();

    // Preserve original order in the thread
    const ordered = chunkIds.map(id => posts.find(p => p._id.toString() === id)).filter(Boolean);

    return res.status(200).json({ Posts: ordered });

  } catch (error) {

    console.error('Error fetching post chunk:', error);

    return res.status(500).json({ error: 'Failed to fetch post chunk' });

  }

};

module.exports = {
    newThread,
    newPost,
    getPostsChunk
};
