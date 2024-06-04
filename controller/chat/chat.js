const Chat = require("../../models/chat.model");
const User = require("../../models/user.model");
const initSocket = require("../../routes/socket");

// Initialize socket.io and pass the server instance
const server = require('http').createServer();
const io = require('socket.io')(server);
initSocket(io);

const chatController = {
  async sendChat(req, res) {

        try {
            const { sender, receiver, message } = req.body;

            // Create a new chat document in MongoDB
            const newChat = new Chat({
              sender,
              receiver,
              message,
            });
            await newChat.save(); // Save the chat to MongoDB
        
            // Emit the chat message to the receiver
            io.to(receiver).emit("receiveChat", newChat);
        
            res.status(200).json({data:{ success: true, data: newChat }});
          
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
  },

  async sendAudioMessage(req, res) {

    try {
        const { sender, receiver } = req.body;
        let audioMessage = req.fileUrl

        // Create a new chat document in MongoDB
        const newChat = new Chat({
          sender,
          receiver,
          audioMessage,
        });
        await newChat.save(); // Save the chat to MongoDB
    
        // Emit the chat message to the receiver
        io.to(receiver).emit("receiveChat", newChat);
    
        res.status(200).json({data:{ success: true, data: newChat }});
      
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
},


  // get chatted users
  async getChattedUsers(req, res) {
    const personId = req.params.personId;

    try {
        // Find distinct sender IDs where the person ID matches the receiver
        const senders = await Chat.distinct("sender", { receiver: personId });
        // Find distinct receiver IDs where the person ID matches the sender
        const receivers = await Chat.distinct("receiver", { sender: personId });

        // Create a Set to store unique user IDs
        const chattedUsersSet = new Set([...senders, ...receivers]);

        // Convert the Set back to an array
        const chattedUsersArray = Array.from(chattedUsersSet);
        let image = null

        // Populate the sender and receiver fields
        const populatedUsers = await User.find({
          _id: { $in: chattedUsersArray },
        })
          .populate("sender")
          .populate("receiver");

        let chats = [];

        // Retrieve the last chat for each user
        for (let user of populatedUsers) {
          // Find the last chat where the user is either sender or receiver
          let lastChat = await Chat.find({
            $or: [{ sender: user._id }, { receiver: user._id }],
          })
          .sort({ date: 1 });
          if(user.image){
            image = user.image
          }

          let unread= 0
          lastChat.map((val, ind) => {
            if(!val.isRead){
                unread++
            }
          })

          // Attach the last chat to the user object
          chats.push({
            user_id: user._id,
            name: user.name,
            image,
            chat: lastChat[lastChat.length - 1].message,
            date: lastChat[lastChat.length - 1].date,
            isRead: lastChat[lastChat.length - 1].isRead,
            audioMessage: lastChat[lastChat.length - 1].audioMessage,
            unReadMessages: unread
          });
          user.lastChat = lastChat;
        }

        // chats.sort((a, b) => b.date - a.date);

        // Emit the populated chatted users to the client
        io.to(personId).emit("chattedUsers", chats);
        res.status(200).json({data:{ success: true, chats: chats }});
      
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
},


// get Chats
async getChats(req, res) {
    const {senderId, receiverId} = req.params;

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
          io.emit("allChats", chats);
          res.status(200).json({data:{ success: true, chats: chats }});

    } catch (error) {
      res.status(500).send({ message: error.message });
    }
},
};

module.exports = chatController;

// router.post("/login", async (req, res) => {
// });
