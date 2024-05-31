const express = require("express");
const postController = require("../../controller/posts/createPost.controller");
const {upload, uploadFileToFirebase} = require("../../services/firebase/Firebase_SignStorage")


const postRouter = express.Router();

// add signature
postRouter.post('/createPost', upload.single('file'), async (req, res, next) => {
    try {
        const id = req.params.id; // Extract id from request parameters
        await uploadFileToFirebase(req, res, next); // Pass id to uploadFileToFirebase function
    } catch (error) {
        console.error('Error handling file upload to Firebase:', error);
        res.status(500).send({ success: false, message: 'Failed to handle file upload' });
    }
}, postController.createPost);



module.exports =  postRouter;
