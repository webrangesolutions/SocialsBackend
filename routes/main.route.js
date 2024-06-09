const express = require("express");
const headRouter = require("./user/auth.route");
const userRouter = require("./user/user.route");
const followRouter = require("./user/follow.route");
const postRouter = require("./posts/createPost.route");
const clipRouter = require("./posts/clips.route");
const formatRouter = require("./posts/format.route");

const exportRouter = require("./exportVideo/exportVideo.route");
const invoiceRouter = require("./exportVideo/invoice.route");

const paymentMethodRouter = require("./paymentMethod/paymentMethod.route");
const ratingRouter = require("./rating/rating");

const chatRouter = require("./chat/chat.route")

const helpRouter = require("./helpAndSupport/help");

const authGuard = require("../middleware/authGuard.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello from server");
});

router.use("/user", headRouter);
router.use("/user", userRouter);
router.use("/user", followRouter);

router.use("/chat", chatRouter);

router.use("/post", postRouter);

router.use("/clip", clipRouter);
router.use("/format", formatRouter);

router.use("/export", exportRouter);
router.use("/invoice", invoiceRouter);

router.use("/paymentMethod", paymentMethodRouter);

router.use("/rating", ratingRouter);

router.use("/help", helpRouter);

module.exports = router;

