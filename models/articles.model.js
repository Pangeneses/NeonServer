const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  Author: {
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
            return /^[a-zA-Z0-9- ]+$/.test(v);
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

        // Block script, XML/HTML tags
        const forbiddenPattern = /<\s*\/?\s*(script|style|iframe|object|embed|svg|math|[a-z]+\:)/i;

        // Allow $$...$$ LaTeX blocks
        // You can extend this if needed, but basic LaTeX doesn't require special regex rules here
        return !forbiddenPattern.test(v);
      },
      message: props => `Article must be at least 500 characters and must not contain XML, JavaScript, or HTML tags.`
    }
  },
  ArticleImage: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$/i.test(v);
        },
        message: props => `Avatar should be UUID and .jpg or .webp.`
    }
  },
  CreatedDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  Category: { 
    type: Number, 
    required: true,
    validate: {
      validator: v => Number.isInteger(v) && v >= 0 && v <= 34,
      message: props => `Category must be an integer between 0 and 34.`
    }
  },
  Hashtags: {
    type: [String],
    required: true,
    validate: {
      validator: arr => arr.every(tag => /^[a-zA-Z0-9]+$/.test(tag)),
      message: 'Each hashtag must be alphanumeric with no special characters.'
    }
  },
  Visible: {
    type: Boolean,
    required: false,
    unique: false
  }
});

module.exports = mongoose.model("ArticleModel", ArticleSchema);