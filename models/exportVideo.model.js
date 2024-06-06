const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const exportVideoSchema = new Schema({
 post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  exportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  exportedFile: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  format: {
    type: 'String',
  },
  codec: {
    type: 'String',
  },
  date:{
    type: Date,
    default: Date.now
  }
});
module.exports =  mongoose.model("exportVideo", exportVideoSchema, "exportVideos");
