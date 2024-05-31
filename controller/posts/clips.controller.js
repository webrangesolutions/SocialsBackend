const Post = require("../../models/post.model");
const path = require('path');
const url = require('url');
const processVideo = require("../../services/ffmpeg/trimVideo")

const clipController = {
  async breakVideo(req, res) {
    try {
      const { postId, clips } = req.body;

      if (!postId || !clips) {
        return res.status(400).send({
          success: false,
          data: { error: "Please provide both postId and clips array" },
        });
      } else {
        const post = await Post.findOneAndUpdate(
          { _id: postId },
          { clips },
          { new: true, runValidators: true } // runValidators will ensure our custom validation is triggered
        );

        if (post) {
          return res.status(200).send({
            success: true,
            data: { message: "Clips added successfully" },
          });
        } else {
          return res.status(404).send({
            success: false,
            data: { error: "Post not found" },
          });
        }
      }
    } catch (error) {
      return res.status(400).send({
        success: false,
        data: { error: error.message },
      });
    }
  },

  async getTrimmedVideo(req, res) {
    try {
      const { id } = req.params;
      const post = await Post.findOne({ _id: id });
  
      if (!post) {
        return res.status(404).send({
          success: false,
          data: { error: "Post not found" },
        });
      }
  
      // Extract the video format from the URL
      const videoUrl = post.video;
      const parsedUrl = url.parse(videoUrl);
      const videoFormat = path.extname(parsedUrl.pathname).substring(1);
      await processVideo(videoUrl, videoFormat,post.clips ,res);
      
  
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).send({
          success: false,
          data: { error: error.message },
        });
      } else {
        console.error('Error after headers sent:', error);
      }
    }
  },
};

module.exports = clipController;
