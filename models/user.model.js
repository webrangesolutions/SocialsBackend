const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
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
    // required: true,
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
  },
  isDeleted:{
    type: Boolean,
    default: false
  },
  termAndCondition:{
    type: Boolean,
    default: false
  }
});

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("user", userSchema, "users");
