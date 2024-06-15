const express = require("express");
const clipController = require("../../controller/posts/clips.controller");

const clipRouter = express.Router();

clipRouter.put("/", clipController.breakVideo);

clipRouter.get("/trimmedVideo/:id/:start/:duration", clipController.getTrimmedVideo);

module.exports =  clipRouter;
