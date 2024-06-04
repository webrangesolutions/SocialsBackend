const Chat = require("../../models/chat.model"); // Import the chat model
const User = require("../../models/user.model");

function initSocket(io) {
  io.on("connection", (socket) => {
    // Function to send a chat message
    socket.on("sendChat", async (data) => {
      try {
        // Create a new chat document in MongoDB
        const newChat = new Chat({
          sender: data.sender,
          receiver: data.receiver,
          message: data.message,
        });
        await newChat.save(); // Save the chat to MongoDB

        // Emit the chat message to the receiver
        io.to(data.receiver).emit("receiveChat", newChat);
      } catch (error) {
        console.error("Error sending chat:", error);
      }
    });

    // Function to get all users with whom a person has chatted, along with their last chat
    socket.on("getRecentChats", async (personId) => {
      try {
        // Find distinct sender IDs where the person ID matches the receiver
        const senders = await Chat.distinct("sender", { receiver: personId });
        // Find distinct receiver IDs where the person ID matches the sender
        const receivers = await Chat.distinct("receiver", { sender: personId });

        // Create a Set to store unique user IDs
        const chattedUsersSet = new Set([...senders, ...receivers]);

        // Convert the Set back to an array
        const chattedUsersArray = Array.from(chattedUsersSet);

        // Populate the sender and receiver fields
        const populatedUsers = await User.find({
          _id: { $in: chattedUsersArray },
        })
          .populate("sender")
          .populate("receiver")

        let chats = [];

        // Retrieve the last chat for each user
        for (let user of populatedUsers) {
          // Find the last chat where the user is either sender or receiver
          let lastChat = await Chat.find({
            $or: [{ sender: user._id }, { receiver: user._id }],
          }).sort({ createdAt: -1 });

          const lastMessageDate = new Date(lastChat[lastChat.length - 1].date);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

          // Attach the last chat to the user object
          if (lastMessageDate > oneWeekAgo) {
            chats.push({
              user_id: user._id,
              name: user.name,
              companyName: user.companyName,
              image: user.image,
              chat: lastChat[lastChat.length - 1].message,
              date: lastChat[lastChat.length - 1].date,
            });
          }
          user.lastChat = lastChat;
        }
        chats.sort((a, b) => b.date - a.date);

        // Emit the populated chatted users to the client
        socket.emit("chattedRecentUsers", chats);
      } catch (error) {
        console.error("Error retrieving chatted users:", error);
      }
    });

    socket.on("getChats", async ({ senderId, receiverId }) => {
      try {
       
      } catch (error) {
        console.error("Error retrieving chats:", error);
      }
    });

    // Function to handle disconnection
    socket.on("disconnect", () => {});
  });
}

module.exports = initSocket;
