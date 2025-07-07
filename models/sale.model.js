const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SaleSchema = new Schema({
  Item: {
    type: Schema.Types.ObjectId,
    ref: 'ItemModel',
    required: true
  },
  NumberBought: {
    type: Number,
    required: true,
    min: 1
  },
  PurchasedDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  SaleToken: {
    type: Schema.Types.ObjectId,
    ref: 'SaleTokenModel',
    required: true
  }
});

module.exports = mongoose.model("SaleModel", SaleSchema);