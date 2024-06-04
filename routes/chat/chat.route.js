// chat.routes.js

const express = require("express");
const chatController = require("../../controller/chat/chat");

const chatRouter = express.Router();
const initSocket = require("../socket");

// Initialize socket.io and pass the server instance
const server = require('http').createServer();
const io = require('socket.io')(server);
initSocket(io);

// Endpoint to send a chat message
chatRouter.post('/send', chatController.sendChat);

// Endpoint to get all users with whom a person has chatted, along with their last chat
chatRouter.get('/chattedUsers/:personId', chatController.getChattedUsers);

// Endpoint to get all chats between two users
chatRouter.get('/allChats/:senderId/:receiverId', chatController.getChats);

module.exports = chatRouter;
