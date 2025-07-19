const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  AuthorID: {
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
            return /^[a-zA-Z0-9-; ]+$/.test(v);
        },
        message: props => `Thread title shouldn't include special characters.`
    }
  },
  ThreadBody: {
    type: String,
    required: [true, `Thread requires content.`],
    trim: true,
    validate: {
      validator: function (v) {
        if (!v || v.length < 500) return false;
      },
      message: props => `Thread must be at least 500 characters and must not contain XML, JavaScript, or HTML tags.`
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
  ThreadVisibility: {
    type: Boolean,
    required: false,
    unique: false,
    default: true
  }
});

module.exports = mongoose.model("ThreadModel", ThreadSchema);