const express = require("express");
const userController = require("../../controller/user/user.controller");

const deleteController = require("../../controller/user/deleteUser.controller");
const emailController = require("../../controller/user/sendMail.controller");
const {upload, uploadFileToFirebase} = require("../../services/firebase/Firebase_SignStorage")


const userRouter = express.Router();

// add image
userRouter.put('/updateImage/:id', upload.single('file'), async (req, res, next) => {
    try {

        await uploadFileToFirebase(req, res, next); // Pass id to uploadFileToFirebase function
    } catch (error) {
        console.error('Error handling file upload to Firebase:', error);
        res.status(500).send({ success: false, message: 'Failed to handle file upload' });
    }
}, userController.updateUserImage);

userRouter.get('/image/:id', userController.getUserImage);
userRouter.get('/getUser/:id?', userController.getUser);
userRouter.put('/updateUser/:id', userController.updateUser);

userRouter.delete('/deleteUser/:id', deleteController.deleteUser);

userRouter.post('/sendEmail', emailController.sendLinkToEmail);
userRouter.put('/updateDuration/:id', emailController.updateDuration);
userRouter.get('/checkLink/:id', emailController.checkLink);
userRouter.get('/editors', emailController.getEditors);

userRouter.get('/activeEditors', emailController.getActiveEditors);

module.exports =  userRouter;
