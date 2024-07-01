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
    const { id, start, duration } = req.params;
    
    try {
        // Fetch the video URL and format from the database
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send({
                success: false,
                data: { error: 'Post not found' },
            });
        }
        
        const videoUrl = post.video;
        const videoFormat = 'mp4';  // Assuming the format is mp4; adjust as necessary

        console.log("start..", start, "..duration..", duration)

        await processVideo(videoUrl, videoFormat, start, duration, req, res);
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).send({
            success: false,
            data: { error: 'Failed to process video' },
        });
    }
  },
};

module.exports = clipController;
