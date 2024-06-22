const changeFormat = require("../../services/ffmpeg/changeFormat");
const changeFormatToProres = require("../../services/ffmpeg/changeFormatToProres");
const processVideo = require("../../services/ffmpeg/changeCodec");

const videoConversionController = {
  async changeFormat(req, res) {
    try {
      const inputFilePath = req.body.file; // Use req.file.path provided by multer
      const format = req.body.format;
      console.log("files are", req.body.file);
      changeFormat(inputFilePath, format, res, {
        send: console.log,
        status: (code) => ({ send: (msg) => {console.log(`Status ${code}: ${msg}`)
          res.status(400).send({
            success: false,
            videoUrl: null,
            error:msg
          });
        } })
      });
      // await changeFormat(inputFilePath, format, res);
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
      const {videoUrl, videoFormat} = req.body
      console.log(req.body)
      await changeFormatToProres(videoUrl, videoFormat, res);
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

  async changeCodec(req, res) {
    try {
      const {file,  codec} = req.body
      console.log(req.body)
      await processVideo(file, codec, res);
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
