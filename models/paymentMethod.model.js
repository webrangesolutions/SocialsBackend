const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const paymentMethodSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  },
  paymentMethod: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  holderName: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true
  }, 
  routingNumber: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true
  },
  date:{
    type: Date,
    default: Date.now
  }
});
module.exports =  mongoose.model("paymentMethod", paymentMethodSchema, "paymentMethods");
