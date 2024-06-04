const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const chatSchema = new Schema({
 sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  message: {
    type: 'String',
  },
  audioMessage: {
    type: 'String',
  },
  date: {
    type: Date,
    default: Date.now  
  },
  isRead: {
    type: Boolean,
    default: false  
  },
});
module.exports =  mongoose.model("chat", chatSchema, "chats");
