const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const clipSchema = new Schema({
  from: {
    type: String,
  },
  duration: {
    type: String,
  },
}, { _id: false });

const postSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  },
  location: {
    type: String,
  },
  mention: {
    type: Array,
  },
  tags: {
    type: Array,
  },
  video: {
    type: String,
    required: true,
  },
  clips: {
    type: [clipSchema],
    validate: {
      validator: function(clips) {
        const uniquePairs = new Set();
        for (let clip of clips) {
          const pair = `${clip.from}-${clip.duration}`;
          if (uniquePairs.has(pair)) {
            return false;
          }
          uniquePairs.add(pair);
        }
        return true;
      },
      message: "Clip 'from' and 'duration' values must be unique.",
    },
  },
});

module.exports = mongoose.model("post", postSchema, "posts");
