const mongoose = require('mongoose');

const ThreadModel = require('../models/threads.model');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li',
    'p', 'br', 'span', 'blockquote', 'code', 'pre',
    'img', 'a', 'h1', 'h2', 'h3'
  ],
  allowedAttributes: {
    '*': ['style'],
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'data'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    a: ['http', 'https', 'mailto']
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank'
    })
  }
};

function sanitizeBodyFull(body) {

  const cleaned = sanitizeHtml(body || '', sanitizeOptions);

  const plainText = cleaned.replace(/<[^>]*>/g, '');

  if (!cleaned || plainText.trim().length < 500) {

    return null;

  }

  return cleaned;
}

function sanitizeBodyStrict(body) {

  const cleaned = sanitizeHtml(body || '', { allowedTags: [], allowedAttributes: {} });

  if (!cleaned || cleaned.replace(/\s/g, '').length < 500) {

    return null;

  }

  return cleaned;

}

function validateHashtags(tags) {

  if (
    !Array.isArray(tags.ThreadHashtags) ||
    tags.ThreadHashtags.length > 10 ||
    !tags.ThreadHashtags.every(tag =>
      typeof tag === 'string' &&
      tag.length <= 30 &&
      /^#[a-zA-Z0-9]{1,29}$/.test(tag)
    )
  ) {
  
    throw new Error('Each hashtag must start with # and contain only letters and numbers (max 30 chars total).');

  }

}

function validateCategory(category) {
  
  if (typeof category !== 'string' || category.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(category)) {

    throw new Error('ThreadCategory must be a non-empty string under 50 chars using letters, numbers, _ or -.');

  }

}
  
function validateImageFilename(filename) {

  if (!filename) return;

  const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/i.test(filename);

  if (!isValid) {

    throw new Error('ThreadImage must be a UUID with .webp or .jpg extension.');

  }

}

function insertSpacesBetweenLowerUpper(text) {

  return text.replace(/([a-z])([A-Z])/g, '$1 $2');

}

const newThread = async (req, res) => {

  console.log('Received thread POST body:', req.body);

  try {

    const {
      AuthorID,
      ThreadTitle,
      ThreadBody,
      ThreadImage,
      ThreadCategory,
      ThreadHashtags,
      ThreadVisibility
    } = req.body;

    if (!AuthorID) {

      return res.status(400).json({ error: 'Author is required.' });

    }
    
    try {
      validateHashtags({ ThreadHashtags: ThreadHashtags || [] });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    try {
      const cleanedCategory = ThreadCategory.replace(/[\s_]/g, '');
      validateCategory(cleanedCategory);    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    try {
      validateImageFilename(ThreadImage);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    const cleanedBody = sanitizeBodyFull(ThreadBody);

    if (!cleanedBody) {

      return res.status(400).json({

        error: 'Thread must be at least 500 non-whitespace characters after sanitizing.'

      });

    }

    const newThread = new ThreadModel({
      AuthorID,
      ThreadTitle,
      ThreadBody: cleanedBody,
      ThreadImage,
      ThreadCategory: cleanedCategory,
      ThreadHashtags,
      ThreadVisibility
    });

    const savedThread = await newThread.save();

    const formatted = {
      ...savedThread.toObject(),
      ThreadID: savedThread._id.toString(),
      ThreadCategory: insertSpacesBetweenLowerUpper(savedThread.ThreadCategory),
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

    const Thread = await ThreadModel.findById(id)
      .populate('AuthorID');

    if (!Thread) {

      return res.status(404).json({ error: 'Thread not found' });

    }

    const formatted = {
      ...Thread.toObject(),
      ThreadID: Thread._id.toString(),
      ThreadCategory: insertSpacesBetweenLowerUpper(Thread.ThreadCategory)
    };

    res.status(200).json({ Thread: formatted });

  } catch (error) {

    console.error('Error fetching Thread:', error);

    res.status(500).json({ error: 'Failed to fetch Thread' });

  }

};

const getThreadsChunk = async (req, res) => {
  try {
    let {
      AuthorID,
      ThreadCategory,
      ThreadHashtags,
      from,
      to,
      limit,
      lastId,
      direction = 'down'
    } = req.query;

    console.log('GET /chunk received with query:', req.query);

    const filter = {};

    if (typeof AuthorID === 'string') {

      AuthorID = [AuthorID];

    }

    if (Array.isArray(AuthorID)) {

      const cleanedIDs = AuthorID.filter(id => typeof id === 'string' && id.trim() !== '');

      if (cleanedIDs.length > 0) {

        filter.AuthorID = { $in: cleanedIDs };

      }

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

    if (from || to) {

      filter.ThreadDate = {};

      if (from && !isNaN(Date.parse(from))) {

        filter.ThreadDate.$gte = new Date(from);

      }

      if (to && !isNaN(Date.parse(to))) {

        filter.ThreadDate.$lte = new Date(to);

      }

    }
    
    const chunkLimit = Math.min(parseInt(limit) || 10, 100);

    direction = direction === 'up' ? 'up' : 'down';

    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {

      const op = direction === 'up' ? '$gt' : '$lt';

      filter._id = { [op]: new mongoose.Types.ObjectId(lastId) };

    }

    const sortOrder = direction === 'up' ? 1 : -1;

    const Threads = await ThreadModel.find(filter)
      .populate('AuthorID')
      .sort({ _id: sortOrder })
      .limit(chunkLimit);

    const formatted = Threads.map(thread => {

      const obj = thread.toObject();

      return {
        ...obj,
        ThreadID: obj._id.toString(), // ✅ Add this line
        ThreadCategory: insertSpacesBetweenLowerUpper(obj.ThreadCategory),
      };

    });

    return res.status(200).json({ Threads: formatted });

  } catch (error) {

    console.error('Error fetching thread chunk:', error);

    return res.status(500).json({ error: 'Failed to fetch thread chunk' });

  }

};

const putThread = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid thread ID' });

  }

  try {
    
    const existing = await ThreadModel.findById(id);

    if (!existing) {

      return res.status(404).json({ error: 'Thread not found' });

    }

    const updates = { ...req.body };
    
    try {
      validateHashtags({ ThreadHashtags: updates.ThreadHashtags || [] });    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    try {
      validateCategory(updates.ThreadCategory);    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    try {
      validateImageFilename(updates.ThreadImage);    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    if (updates.ThreadBody) {

      const cleanedBody = sanitizeBodyFull(updates.ThreadBody);

      if (!cleanedBody) {

        return res.status(400).json({

          error: 'ThreadBody must be at least 500 characters after sanitizing.'

        });

      }

      updates.ThreadBody = cleanedBody;

    }

    const updated = await ThreadModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('AuthorID');

    const formatted = {
      ...updated.toObject(),
      ThreadID: updated._id.toString(),
      ThreadCategory: insertSpacesBetweenLowerUpper(updated.ThreadCategory)
    };

    res.status(200).json({ message: 'Thread updated', Thread: formatted });

  } catch (error) {

    console.error('Error updating thread:', error);

    res.status(500).json({ error: 'Failed to update thread' });

  }

};

const patchThread = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid thread ID' });

  }

  try {
    
    const existing = await ThreadModel.findById(id);

    if (!existing) {

      return res.status(404).json({ error: 'Thread not found' });

    }

    const updates = { ...req.body };

    try {
      validateHashtags({ ThreadHashtags: updates.ThreadHashtags || [] });    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    try {
      validateCategory(updates.ThreadCategory);    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    try {
      validateImageFilename(updates.ThreadImage);    
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    if (updates.ThreadBody) {

      const cleanedBody = sanitizeBodyFull(updates.ThreadBody);

      if (!cleanedBody) {

        return res.status(400).json({

          error: 'ThreadBody must be at least 500 characters after sanitizing.'

        });

      }

      updates.ThreadBody = cleanedBody;

    }

    const updated = await ThreadModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('AuthorID');

    const formatted = {
      ...updated.toObject(),
      ThreadID: updated._id.toString(),
      ThreadCategory: insertSpacesBetweenLowerUpper(updated.ThreadCategory)
    };

    res.status(200).json({ message: 'Thread updated', Thread: formatted });

  } catch (error) {

    console.error('Error patching thread:', error);

    res.status(500).json({ error: 'Failed to update thread' });

  }

};

const deleteThread = async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    return res.status(400).json({ error: 'Invalid thread ID' });

  }

  try {

    const deleted = await ThreadModel.findByIdAndDelete(id);

    if (!deleted) {

      return res.status(404).json({ error: 'Thread not found' });

    }

    res.status(200).json({ message: 'Thread deleted successfully' });

  } catch (error) {

    console.error('Error deleting thread:', error);

    res.status(500).json({ error: 'Failed to delete thread' });

  }
  
};

module.exports = {
    newThread,
    getThreadsChunk,
    getThread,
    putThread,
    patchThread,
    deleteThread
}