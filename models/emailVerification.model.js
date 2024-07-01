const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const emailVerificationSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  issueDate:{
    type: Date,
    default: Date.now
  },
  expiryDate:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("emailVerification", emailVerificationSchema, "emailVerifications");
