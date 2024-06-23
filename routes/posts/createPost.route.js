const express = require("express");
const postController = require("../../controller/posts/createGetPost.controller");
const { upload, uploadFilesToFirebase } = require("../../services/firebase/Firebase_Thumbnail");

const postRouter = express.Router();

postRouter.post('/createPost', upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res, next) => {
    try {
        await uploadFilesToFirebase(req, res, next);
    }
        catch (error) {
            console.error('Error handling file upload to Firebase:', error);
            res.status(500).send({ success: false, message: 'Failed to handle file upload' });
        }
    }, postController.createPost);

postRouter.get('/userPost/:id?', postController.getUserPost);
postRouter.get('/userPostGroupedWithTime/:id?', postController.getUserPostWithTime);
postRouter.get('/getPostToSearch', postController.getSearchedItems);
postRouter.get('/searchPost/:area?/:username?/:mention?/:tags?', postController.searchPost);

postRouter.get('/proxy-video', postController.proxyController);

module.exports = postRouter;
