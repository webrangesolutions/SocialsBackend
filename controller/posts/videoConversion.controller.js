const changeFormat = require("../../services/ffmpeg/changeFormat");
const changeFormatToProres = require("../../services/ffmpeg/changeFormatToProres");
const changeToHevc = require("../../services/ffmpeg/changeCodec");

const videoConversionController = {
  async changeFormat(req, res) {
    try {
      const inputFilePath = req.file.filename; // Use req.file.path provided by multer
      const format = req.body.format;
      console.log("files are", req.file);
      await changeFormat(inputFilePath, format, res);
    } catch (error) {
      console.error("Error after headers sent:", error);
      if (!res.headersSent) {
        return res.status(500).send({
          success: false,
          data: { error: error.message },
        });
      }
    }
  },

  async changeFormatToProres(req, res) {
    try {
      const inputFilePath = req.file.filename; 
      console.log("files are", req.file);
      await changeFormatToProres(inputFilePath, res, req);
    } catch (error) {
      console.error("Error after headers sent:", error);
      if (!res.headersSent) {
        return res.status(500).send({
          success: false,
          data: { error: error.message },
        });
      }
    }
  },

  async changeCodecToHevc(req, res) {
    try {
      const inputFilePath = req.file.filename; // Use req.file.path provided by multer
      console.log("files are", req.file);
      const format = req.body.format;
      await changeToHevc(inputFilePath, format, res);
    } catch (error) {
      console.error("Error after headers sent:", error);
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
