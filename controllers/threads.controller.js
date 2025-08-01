const mongoose = require('mongoose');

const ThreadModel = require('../models/threads.model');
const PostModel = require('../models/post.model');
const UserModel = require('../models/users.model');

const sanitizers = require('../services/sanitizer.service');

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

    res.status(200).json({ Thread: formatted });

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

    if (ThreadFrom || ThreadTo) {
  
      filter.ThreadDate = {};
  
      if (ThreadFrom && !isNaN(Date.parse(ThreadFrom))) {
  
        filter.ThreadDate.$gte = new Date(ThreadFrom);
  
      }
  
      if (ThreadTo && !isNaN(Date.parse(ThreadTo))) {
  
        filter.ThreadDate.$lte = new Date(ThreadTo);
  
      }
  
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

        if(postObj.PostUserID){

          userObj = await UserModel.findById(postObj.PostUserID).lean();

        }

        console.log(userObj.UserName);

        if (postObj && userObj) {
  
          formattedThread.ThreadPostID = postObj._id?.toString();
  
          formattedThread.ThreadUserID = postObj.PostUserID?._id?.toString() ?? postObj.PostUserID?.toString();
  
          formattedThread.ThreadUserName = userObj.UserName;
  
          formattedThread.ThreadBody = postObj.PostBody;

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
  getThread,
  getThreadChunk
};
