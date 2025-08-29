const mongoose = require('mongoose');

const UserModel = require('../models/users.model');
const ThreadModel = require('../models/threads.model');
const PostModel = require('../models/post.model');

const sanitizers = require('../services/sanitizer.service')

const newPost = async (req, res) => {

  try {

    const {
      PostUserID,
      PostBody,
      PostDate,
      PostThreadID
    } = req.body;

    // Validate PostUserID
    if (!PostUserID || !mongoose.Types.ObjectId.isValid(PostUserID)) {

      return res.status(400).json({ error: 'Valid PostUserID is required.' });

    }

    // Validate PostThreadID
    if (!PostThreadID || !mongoose.Types.ObjectId.isValid(PostThreadID)) {

      return res.status(400).json({ error: 'Valid PostThreadID is required.' });

    }

    if (!PostBody || typeof PostBody !== 'string') {

      return res.status(400).json({ error: 'PostBody must be a non-empty string.' });

    }

    const cleanedBody = sanitizers.sanitizeBodyFull(PostBody);

    if (!cleanedBody) {

      return res.status(400).json({ error: 'PostBody is empty after sanitization.' });

    }

    const he = require('he');
    const plainText = cleanedBody.replace(/<[^>]*>/g, '');
    const decodedText = he.decode(plainText);
    const charCount = decodedText.trim().length;

    if (!cleanedBody || 0 > charCount) {

      return res.status(400).json({

        error: 'ThreadPost must be at least 100.'

      });

    }

    if (!cleanedBody || charCount > 3000) {

      return res.status(400).json({

        error: 'ThreadPost must be less than 3000 characters.'

      });

    }

    // Get the last post in the thread's Posts array
    const thread = await ThreadModel.findById(PostThreadID);

    if (!thread) {

      return res.status(404).json({ error: 'Thread not found.' });

    }

    const lastPostID = thread.ThreadPosts.length > 0
      ? thread.ThreadPosts[thread.ThreadPosts.length - 1]
      : null;

    // Create new Post
    const newPost = new PostModel({
      PostUserID: PostUserID,
      PostBody: cleanedBody,
      PostDate: PostDate || Date.now(),
      PostToPost: lastPostID,
      PostToThread: PostThreadID,
      PostVisibility: true
    });

    const savedPost = await newPost.save();

    if(!savedPost) {

      return res.status(404).json({ error: 'Failed to create Post.' });

    }

    thread.ThreadPosts.push(savedPost._id);

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

      console.log('Error details:', error.error?.details || error);

      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });

    }

    console.error('Failed to create post:', error);

    return res.status(500).json({ error: 'Internal server error' });

  }

};

const getBatch = async (req, res) => {

  try {

    let { PostIDs } = req.query;

    if (!PostIDs) {

      return res.status(400).json({ error: 'Missing PostIDs parameter(s).' });

    }

    const PostIDss = Array.isArray(PostIDs) ? PostIDs : [PostIDs];

    const invalidID = PostIDss.find(id => !mongoose.Types.ObjectId.isValid(id));

    if (invalidID) {

      return res.status(400).json({ error: `Invalid PostIDs: ${invalidID}` });

    }

    const posts = await PostModel.find({ _id: { $in: PostIDss } })
      .lean();

    const enriched = await Promise.all(
      posts.map(async p => {

        const user = await UserModel.findById(p.PostUserID).lean();

        const isPopulated = user ? true : false;

        return {
          PostID: p._id,
          PostBody: p.PostBody,
          PostDate: p.PostDate,
          PostToThread: p.PostToThread,
          PostToPost: p.PostToPost,
          PostUserID: isPopulated ? user._id : user,
          PostUserName: isPopulated ? user.UserName : 'Unknown',
          PostUserAvatar: isPopulated ? user.Avatar : null
        };

      })
      
    );

    // Preserve original order
    const ordered = PostIDss.map(id => enriched.find(p => p.PostID.toString() === id)).filter(Boolean);

    return res.status(200).json({ Posts: ordered });

  } catch (error) {

    console.error('Error fetching post batch:', error);

    return res.status(500).json({ error: 'Failed to fetch post batch' });

  }

};

module.exports = {
  newPost,
  getBatch
};
