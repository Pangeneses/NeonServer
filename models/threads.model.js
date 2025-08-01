const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  ThreadUserID: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  ThreadTitle: {
    type: String,
    required: [true, `Thread requires title.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9-;?!' ]+$/.test(v);
        },
        message: props => `Thread title shouldn't include special characters.`
    }
  },
  ThreadImage: {
    type: String,
    required: false,
    trim: true, 
    validate: {
      validator: function (v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/i.test(v);
      },
      message: props => `ThreadImage must be a UUID with .webp or .jpg extension.`
    },
    default: "d741b779-9c57-472a-a983-5c1dcaef7426.webp"
  },
  ThreadDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  ThreadAccess: {
    type: Number,
    required: true,
    min: [0, 'User Active requirement must be minimum 3 months.'],
    max: [60, 'User Active requirement cannot be more than 60 months.']
  },
  ThreadCategory: { 
    type: String, 
    required: true,
  },
  ThreadHashtags: {
    type: [String],
    required: true,
    validate: {
      validator: arr =>
        Array.isArray(arr) &&
        arr.length <= 10 &&
        arr.every(tag => typeof tag === 'string' && tag.length <= 30 && /^#[a-zA-Z0-9]{1,29}$/.test(tag)),
      message: 'Each hashtag must be an alphanumeric string under 30 chars.'
    }
  },
  ThreadPosts: {
    type: [Schema.Types.ObjectId],
    ref: 'PostModel',
    required: true,
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length === 1;
      },
      message: 'Thread must be initialized with exactly one post.'
    }
  },
  ThreadVisibility: {
    type: Boolean,
    required: false,
    unique: false,
    default: true
  }
});

module.exports = mongoose.model("ThreadModel", ThreadSchema);