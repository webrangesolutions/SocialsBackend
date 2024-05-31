const User = require("../../models/user.model");

const followController = {
  async followUser(req, res) {
    try {
      const { userId, followId } = req.body;

      if (!userId || !followId) {
        return res
          .status(400)
          .send({
            success: false,
            data: { error: "Please provide both userId ad followId" },
          });
      } else {
        const followerPromise = User.findOneAndUpdate(
          { _id: followId },
          { $push: { followers: userId } },
          { new: true, useFindAndModify: false }
        );

        const followingPromise = User.findOneAndUpdate(
          { _id: userId },
          { $push: { following: followId } },
          { new: true, useFindAndModify: false }
        );

        await Promise.all([followerPromise, followingPromise])
          .then((result) => {
            return res.status(200).send({
              success: true,
              data: { message: "User followed successfully" },
            });
          })
          .catch((err) => {
            return res
              .status(400)
              .send({ success: false, data: { error: err.message } });
          });
      }
    } catch (error) {
      return res.status(404).send({
        success: false,
        data: { error: error.response },
      });
    }
  },
  async unFollowUser(req, res) {
    try {
      const { userId, followId } = req.body;
      if (!userId || !followId) {
        return res
          .status(400)
          .send({
            success: false,
            data: { error: "Please provide both userId ad followId" },
          });
      } else {
        const followerPromise = User.findOneAndUpdate(
          { _id: followId },
          { $pull: { followers: userId } },
          { new: true, useFindAndModify: false }
        );

        const followingPromise = User.findOneAndUpdate(
          { _id: userId },
          { $pull: { following: followId } },
          { new: true, useFindAndModify: false }
        );

        await Promise.all([followerPromise, followingPromise])
          .then((result) => {
            return res.status(200).send({
              success: true,
              data: {
                message:
                  "User has been successfully removed from following list",
              },
            });
          })
          .catch((err) => {
            return res
              .status(400)
              .send({ success: false, data: { error: err.message } });
          });
      }
    } catch (error) {
      return res.status(404).send({
        success: false,
        data: { error: error.response },
      });
    }
  },
};

module.exports = followController;

// router.post("/login", async (req, res) => {
// });
