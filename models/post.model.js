const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  Author: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true,
    unique: false
  },
  Thread: {
    type: Schema.Types.ObjectId,
    ref: 'ThreadModel',
    required: true,
    unique: false
  },
  PostContent: {
    type: String,
    required: true,
    trim: false, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9`'" \n\r]+$/.test(v);
        },
        message: props => `Post content should follow character rules.`
    },
    minlength: 500,
    unique: false
  },
  CreatedDate: {
    type: Date,
    default: Date.now,
    immutable: true,
    unique: false
  }
});

module.exports = mongoose.model("PostModel", PostSchema);