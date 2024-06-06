const express = require("express");
const exportVideoController = require("../../controller/exportVideos/export.controller");
const {upload, uploadFileToFirebase} = require("../../services/firebase/Firebase_SignStorage")


const exportVideoRouter = express.Router();

// add exportVideo
exportVideoRouter.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const id = req.params.id; // Extract id from request parameters
        await uploadFileToFirebase(req, res, next); // Pass id to uploadFileToFirebase function
    } catch (error) {
        console.error('Error handling file upload to Firebase:', error);
        res.status(500).send({ success: false, message: 'Failed to handle file upload' });
    }
}, exportVideoController.createExport);

// add exportVideo
exportVideoRouter.put('/generateLink', upload.single('file'), async (req, res, next) => {
    try {
        const id = req.params.id; // Extract id from request parameters
        await uploadFileToFirebase(req, res, next); // Pass id to uploadFileToFirebase function
    } catch (error) {
        console.error('Error handling file upload to Firebase:', error);
        res.status(500).send({ success: false, message: 'Failed to handle file upload' });
    }
}, exportVideoController.generateLink);

exportVideoRouter.get('/getExported/:id', exportVideoController.getUserExport);


module.exports =  exportVideoRouter;
