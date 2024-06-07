const express = require("express");
const helpAndSupportController = require("../../controller/helpAndSupport/helpAndSupport.controller");
const {upload, uploadFileToFirebase} = require("../../services/firebase/Firebase_SignStorage")


const helpAndSupportRouter = express.Router();

// add helpAndSupport
helpAndSupportRouter.post('/',helpAndSupportController.createHelpAndSupport);

helpAndSupportRouter.get('/getHelp/:id?', helpAndSupportController.getUserHelpAndSupport);


module.exports =  helpAndSupportRouter;
