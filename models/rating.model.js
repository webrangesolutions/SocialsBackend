const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ratingSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  },
  videoId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "post",
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
 
  
});
module.exports =  mongoose.model("rating", ratingSchema, "ratings");
