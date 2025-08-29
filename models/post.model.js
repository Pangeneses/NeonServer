const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  PostUserID: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true,
    unique: false
  },
  PostBody: {
    type: String,
    required: true,
    trim: false,
    minlength: 0,
    maxlength: 3000,
    unique: false
  },
  PostDate: {
    type: Date,
    default: Date.now,
    immutable: true,
    unique: false
  },
  PostToThread: {
    type: Schema.Types.ObjectId,
    ref: 'ThreadModel',
    required: function () {
      return this.PostToPost !== null;
    }
  },
  PostToPost: {
    type: Schema.Types.ObjectId,
    ref: 'PostModel',
    required: function () {
      return this.PostToThread !== null;
    }
  },
  PostVisibility: {
    type: Boolean,
    required: false,
    unique: false,
    default: true
  }
});

module.exports = mongoose.model("PostModel", PostSchema);