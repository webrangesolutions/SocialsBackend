// controllers/deleteController.js

const User = require("../../models/user.model");
const Post = require("../../models/post.model");
const PaymentMethod = require("../../models/paymentMethod.model");
const Export = require("../../models/exportVideo.model");
const Rating = require("../../models/rating.model");

const deleteController = {
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      await PaymentMethod.deleteMany({ userId: id });
      await Rating.deleteMany({ userId: id });
      
      // Fetch posts associated with the user
      const posts = await Post.find({ userId: id });

      // Delete exports associated with each post
      for (const post of posts) {
        await Export.deleteMany({ post: post._id });
        await Rating.deleteMany({ videoId: post._id }); 
      }

      // Delete posts associated with the user
      await Post.deleteMany({ userId: id });

      // Delete the user
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User and related data deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = deleteController;
