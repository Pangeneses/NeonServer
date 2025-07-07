const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  ThreadTitle: {
    type: String,
    required: [true, `Thread title required.`],
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9- ]+$/.test(v);
        },
        message: props => `Thread title shouldn't include special characters.`
    },
    unique: false
  },
  CreatedDate: {
    type: Date,
    default: Date.now,
    immutable: true,
    unique: true
  },
  ThreadHashtag: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9 ]+$/.test(v);
        },
        message: props => `Thread hashtags shouldn't include special characters.`
    },
    unique: false
  },
  DeletedThread: {
    type: Boolean,
    default: false,
    unique: false
  }
});

module.exports = mongoose.model("ThreadModel", ThreadSchema);