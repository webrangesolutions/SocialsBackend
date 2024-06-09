const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const paymentMethodSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  },
  sortCode: {
    type: String,
    required: true
  },
  accName: {
    type: String,
    required: true
  },
  accNumber: {
    type: Number,
    required: true,
  },
  bacsCode: {
    type: Number,
    required: true
  }, 
  date:{
    type: Date,
    default: Date.now
  }
});
module.exports =  mongoose.model("paymentMethod", paymentMethodSchema, "paymentMethods");
