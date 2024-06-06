const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
  },
  password: {
    type: String,
  },
  image: {
    type: String,
  },
  about: {
    type: String,
  },
  favourite: {
    type: Array,
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
  date:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("user", userSchema, "users");
