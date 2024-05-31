const changeFormat = require("../../services/ffmpeg/changeFormat");

const videoConversionController = {
  async changeFormat(req, res) {
    try {
      const inputFilePath = req.file.filename; // Use req.file.path provided by multer
      const format = req.body.format
      console.log("File path is", inputFilePath);
      await changeFormat(inputFilePath, format, res);
    } catch (error) {
      console.error('Error after headers sent:', error);
      if (!res.headersSent) {
        return res.status(500).send({
          success: false,
          data: { error: error.message },
        });
      }
    }
  },
};

module.exports = videoConversionController;
