const express = require("express");
const followController = require("../../controller/user/followUser.controller");

const followRouter = express.Router();

followRouter.put("/follow", followController.followUser);
followRouter.put("/unFollow", followController.unFollowUser);


module.exports =  followRouter;
