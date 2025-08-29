const mongoose = require('mongoose');

const ThreadModel = require('../models/threads.model');
const PostModel = require('../models/post.model');
const UserModel = require('../models/users.model');

const sanitizers = require('../services/sanitizer.service');

const newThread = async (req, res) => {

  console.log('Received thread POST body:', req.body);

  try {

    let {
      ThreadUserID,
      ThreadTitle,
      ThreadDate,
      ThreadAccess,
      ThreadCategory,
      ThreadHashtags,
      ThreadPost,
      ThreadVisibility
    } = req.body;

    if (!ThreadUserID || !mongoose.Types.ObjectId.isValid(ThreadUserID)) {

      return res.status(400).json({ error: 'Valid ThreadUserID is required.' });

    }

    // Validate ThreadAccess: number between 0 and 60 (change to 3)
    if (typeof ThreadAccess !== 'number' || ThreadAccess < 0 || ThreadAccess > 60) {

      return res.status(400).json({ error: 'ThreadAccess must be a number between 0 and 60 (months).' });

    }

    let cleanedCategory = '';

    try {

      cleanedCategory = ThreadCategory.replace(/\s|_/g, '');

      sanitizers.validateCategory(cleanedCategory);

    } catch (e) {

      return res.status(400).json({ error: e.message });

    }

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

    if (!cleanedBody || 100 > charCount) {

      return res.status(400).json({

        error: 'ThreadPost must be at least 150.'

      });

    }

    if (!cleanedBody || charCount > 1000) {

      return res.status(400).json({

        error: 'ThreadPost must be less than 3000 characters.'

      });

    }

    let newPost = new PostModel({
      PostUserID: req.body.PostUserID,
      PostContent: cleanedBody,
      PostDate: ThreadDate || Date.now(),
      PostToPost: null,
      PostToThread: null,
      PostVisibility: true
    });

    const savedPost = await newPost.save();

    const newThread = new ThreadModel({
      ThreadUserID,
      ThreadTitle,
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

const getThread = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid Thread ID' });

  }

  try {

    const Thread = await ThreadModel.findById(id).populate('ThreadUserID');

    if (!Thread) {

      return res.status(404).json({ error: 'Thread not found' });

    }

    const formatted = {
      ...Thread.toObject(),
      ThreadID: Thread._id.toString(),
      ThreadCategory: sanitizers.insertSpacesBetweenLowerUpper(Thread.ThreadCategory)
    };

    res.status(200).json(formatted);

  } catch (error) {

    console.error('Error fetching Thread:', error);

    res.status(500).json({ error: 'Failed to fetch Thread' });

  }

};

const getThreadChunk = async (req, res) => {

  try {

    let {
      limit,
      lastID,
      direction = 'down',
      ThreadUserID,
      ThreadCategory,
      ThreadHashtags,
      ThreadFrom,
      ThreadTo,
    } = req.query;

    const filter = {};

    if (typeof ThreadUserID === 'string' && ThreadUserID) {

      filter.ThreadUserID = ThreadUserID;

    }

    if (
      typeof ThreadCategory === 'string' &&
      ThreadCategory.trim() !== '' &&
      ThreadCategory !== 'Unspecified'
    ) {

      const normalizedCategory = ThreadCategory.replace(/[\s_]/g, '');

      if (/^[a-zA-Z]+$/.test(normalizedCategory)) {

        filter.ThreadCategory = normalizedCategory;

      }

    }

    if (typeof ThreadHashtags === 'string') {

      ThreadHashtags = [ThreadHashtags];

    }

    if (
      Array.isArray(ThreadHashtags) &&
      ThreadHashtags.length > 0 &&
      ThreadHashtags.some(tag => typeof tag === 'string' && tag.trim() !== '')
    ) {

      filter.ThreadHashtags = { $in: ThreadHashtags };

    }

    if (
      typeof ThreadFrom === 'string' &&
      typeof ThreadTo === 'string' &&
      !isNaN(Date.parse(ThreadFrom)) &&
      !isNaN(Date.parse(ThreadTo))
    ) {

      const fromDate = new Date(ThreadFrom);
      fromDate.setUTCHours(0, 0, 0, 0);

      const toDate = new Date(ThreadTo);
      toDate.setUTCHours(23, 59, 59, 999);

      filter.ThreadDate = {
        $gte: fromDate,
        $lte: toDate,
      };

    }

    const chunkLimit = Math.min(parseInt(limit) || 10, 100);

    direction = direction === 'up' ? 'up' : 'down';

    if (lastID && mongoose.Types.ObjectId.isValid(lastID)) {

      const op = direction === 'up' ? '$gt' : '$lt';

      filter._id = { [op]: new mongoose.Types.createFromHexString(lastID) };

    }

    const sortOrder = direction === 'up' ? 1 : -1;

    const Threads = await ThreadModel.find(filter)
      .sort({ _id: sortOrder })
      .limit(chunkLimit);

    const formatted = await Promise.all(Threads.map(async thread => {

      const obj = thread.toObject();

      const formattedThread = {
        ...obj,
        ThreadID: obj._id.toString(),
        ThreadCategory: sanitizers.insertSpacesBetweenLowerUpper(obj.ThreadCategory),
      };

      if (Array.isArray(obj.ThreadPosts) && obj.ThreadPosts.length > 0) {

        const post = obj.ThreadPosts[0];

        if (post) {

          postObj = await PostModel.findById(post).lean();

        }

        if (postObj.PostUserID) {

          userObj = await UserModel.findById(postObj.PostUserID).lean();

        }

        if (postObj && userObj) {

          formattedThread.ThreadPostID = postObj._id?.toString();

          formattedThread.ThreadUserID = postObj.PostUserID?._id?.toString() ?? postObj.PostUserID?.toString();

          formattedThread.ThreadUserName = userObj.UserName;

          formattedThread.ThreadBody = postObj.PostBody;

          formattedThread.ThreadUserAvatar = userObj.Avatar;

        }

      }

      return formattedThread;

    }));

    return res.status(200).json({ Threads: formatted });

  } catch (error) {

    console.error('Error fetching thread chunk:', error);

    return res.status(500).json({ error: 'Failed to fetch thread chunk' });

  }

};

module.exports = {
  newThread,
  getThread,
  getThreadChunk
};
