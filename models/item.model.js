const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  Company: {
    type: Schema.Types.ObjectId,
    ref: 'CompanyModel',
    required: true,
    unique: false
  },
  ItemTitle: {
    type: String,
    required: [true, `Item requires name.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9- ]+$/.test(v);
        },
        message: props => `Article title shouldn't include special characters.`
    },
    unique: false
  },
  ItemDescription: {
    type: String,
    required: [true, `Article requires content.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9- ]+$/.test(v);
        },
        message: props => `Item description shouldn't include special characters.`
    },
    unique: false
  },
  ItemSku: {
    type: String,
    required: [true, `Item SKU required.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[0-9-]+$/.test(v);
        },
        message: props => `Item SKU should be numeric with dashes.`
    },
    unique: true
  },
  ItemImage: {
    type: String,
    required: [true, `Item must have an image.`],
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9]+$/.test(v);
        },
        message: props => `Adress shouldn't include special characters.`
    },
    unique: false
  },
  ItemPrice: {
    type: Number,
    required: true,
    min: 0
  },
  ItemAvailable: {
    type: Number,
    required: true,
    min: 1
  },
  CreatedDate: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.model("ItemModel", ItemSchema);