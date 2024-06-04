// chat.routes.js

const express = require("express");
const chatController = require("../../controller/chat/chat");


const {upload, uploadFileToFirebase} = require("../../services/firebase/Firebase_SignStorage")

const chatRouter = express.Router();
const initSocket = require("../socket");

// Initialize socket.io and pass the server instance
const server = require('http').createServer();
const io = require('socket.io')(server);
initSocket(io);

// Endpoint to send a chat message
chatRouter.post('/send', chatController.sendChat);

// send audio message
chatRouter.post('/sendAudio', upload.single('file'), async (req, res, next) => {
    try {
        await uploadFileToFirebase(req, res, next); // Pass id to uploadFileToFirebase function
    } catch (error) {
        console.error('Error handling file upload to Firebase:', error);
        res.status(500).send({ success: false, message: 'Failed to handle file upload' });
    }
}, chatController.sendAudioMessage);

// Endpoint to get all users with whom a person has chatted, along with their last chat
chatRouter.get('/chattedUsers/:personId', chatController.getChattedUsers);

// Endpoint to get all chats between two users
chatRouter.get('/allChats/:senderId/:receiverId', chatController.getChats);

module.exports = chatRouter;
