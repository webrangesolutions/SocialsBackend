const Post = require("../../models/post.model");

const postController = {
  async createPost(req, res) {
      
      let postData = req.body;
      postData.video = req.fileUrl
     
        const post = new Post(postData);

        try {
          const registeredPost = await post.save();
          res.status(200).send({
            message: "Post created successfully",
            data: post
          });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
  },
  
};

module.exports = postController;

// router.post("/login", async (req, res) => {
// });
