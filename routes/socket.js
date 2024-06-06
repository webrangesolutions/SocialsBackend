let sockets = [];
const Chat = require("../models/chat.model"); // Import the chat model
const User = require("../models/user.model");

function initSocket(io) {
  io.on("connection", (socket) => {
    socket.on("getChats", async ({ senderId, receiverId }) => {
      try {
        // Retrieve all chats where either the sender is senderId and receiver is receiverId,
        // or the sender is receiverId and receiver is senderId
        const chats = await Chat.find({
          $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
          ],
        });
        // Emit the chats to the client
        socket.emit("allChats", chats);
      } catch (error) {
        console.error("Error retrieving chats:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(socket.id);
    });
  });


}
module.exports = initSocket