const express = require('express');
const multer = require('multer');
const path = require('path');
const formatController = require("../../controller/posts/videoConversion.controller");

const formatRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files should be saved
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }); // Temporary storage for uploaded files

formatRouter.put('/change-format', upload.single('inputFile'), formatController.changeFormat);

module.exports = formatRouter;
