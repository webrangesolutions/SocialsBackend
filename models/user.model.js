const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  googleId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  image: {
    type: String,
  },
  about: {
    type: String,
  },
  favourite: {
    type: String,
  },
  followers: {
    type: Array,
  },
  following: {
    type: Array,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema, "users");
