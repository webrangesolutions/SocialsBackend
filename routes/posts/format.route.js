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

const upload =  multer({ storage: memoryStorage, limits: { fileSize: 100 * 1024 * 1024 } // 100 MB }); // Temporary storage for uploaded files

formatRouter.put('/changeFormat',  formatController.changeFormat);
formatRouter.put('/changeFormatToProres', upload.single('inputFile'), formatController.changeFormatToProres);

formatRouter.put('/changeCodec', formatController.changeCodec);

module.exports = formatRouter;
