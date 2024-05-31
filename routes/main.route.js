const express = require("express");
const headRouter = require("./user/user.route");
const followRouter = require("./user/follow.route");
const postRouter = require("./posts/createPost.route");
const clipRouter = require("./posts/clips.route");
const formatRouter = require("./posts/format.route");
const paymentMethodRouter = require("./paymentMethod/paymentMethod");
const ratingRouter = require("./rating/rating");
const authGuard = require("../middleware/authGuard.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello from server");
});

router.use("/user", headRouter);
router.use("/user", followRouter);


router.use("/post", postRouter);

router.use("/clip", clipRouter);
router.use("/format", formatRouter);

router.use("/paymentMethod", paymentMethodRouter);

router.use("/rating", ratingRouter);

module.exports = router;

