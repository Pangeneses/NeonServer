const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SaleTokenSchema = new Schema({
  Sale: {
    type: Schema.Types.ObjectId,
    ref: 'SaleModel',
    required: true
  },
  PurchaseToken: {
    type: Number,
    required: true,
    unique: true
  },
});

module.exports = mongoose.model("SaleTokenModel", SaleTokenSchema);