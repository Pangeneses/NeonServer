const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  ArticleUserID: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  ArticleTitle: {
    type: String,
    required: [true, `Article requires title.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9-; ]+$/.test(v);
        },
        message: props => `Article title shouldn't include special characters.`
    }
  },
  ArticleBody: {
    type: String,
    required: [true, `Article requires content.`],
    trim: true,
    validate: {
      validator: function (v) {
        if (!v || v.length < 500) return false;
      },
      message: props => `Article must be at least 500 characters and must not contain XML, JavaScript, or HTML tags.`
    }
  },
  ArticleImage: {
    type: String,
    required: false,
    trim: true, 
    validate: {
      validator: function (v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/i.test(v);
      },
      message: props => `ArticleImage must be a UUID with .webp or .jpg extension.`
    },
    default: "d741b779-9c57-472a-a983-5c1dcaef7426.webp"
  },
  ArticleDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  ArticleCategory: { 
    type: String, 
    required: true,
  },
  ArticleHashtags: {
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
  ArticleVisibility: {
    type: Boolean,
    required: false,
    unique: false,
    default: true
  }
});

module.exports = mongoose.model("ArticleModel", ArticleSchema);