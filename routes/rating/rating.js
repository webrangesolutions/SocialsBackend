const express = require("express");
const ratingController = require("../../controller/rating/rating.controller");

const ratingRouter = express.Router();

ratingRouter.post("/", ratingController.rateVideo);


module.exports =  ratingRouter;
