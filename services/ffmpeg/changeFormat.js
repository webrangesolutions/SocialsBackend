const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const changeFormat = async (file,format, res) => {
  try {
    console.log("File is", file, format);
    let outputFile = "output."+format;

    // Convert the video format using ffmpeg and stream it directly to the response
    ffmpeg("uploads/" + file)
      .withOutputFormat(format)
      .on("end", (stdout, stderr) => {
        console.log("Video conversion completed");
        res.download(__dirname + outputFile, function (err) {
          if (err) throw err;
          fs.unlink(__dirname + outputFile, function (err) {
            if (err) throw err;
            console.log("file deleted");
          });
        });
      })
      .on("error", (err) => {
        console.error("Error occurred during conversion:", err.message);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Error occurred during video conversion",
            ffmpegError: err.message,
          });
        }
      })
      .saveToFile(__dirname + "output."+format)
  } catch (error) {
    console.error("Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
};

module.exports = changeFormat;
