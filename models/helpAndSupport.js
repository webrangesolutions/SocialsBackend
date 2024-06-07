const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const helpAndSupportSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
});
module.exports =  mongoose.model("helpAndSupport", helpAndSupportSchema, "helpAndSupports");
