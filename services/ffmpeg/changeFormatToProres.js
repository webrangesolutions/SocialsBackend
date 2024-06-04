const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const changeFormatTo16BitMOV = async (file, res, req) => {
  try {
    console.log("File prores", file);
    const outputFile = `output.mov`;
    fs.unlink(__dirname + outputFile, function (err) {
      if (err) throw err;
      console.log("Output file deleted");
    });

    // Input file path
    const inputFilePath = path.join("uploads", file);

    // Convert the video format using FFmpeg
    const command = ffmpeg(inputFilePath)
      .withOutputFormat("mov")
      .outputOptions([
        "-c:v prores_ks", // Set video codec to ProRes
        "-profile:v 3", // Set ProRes profile to HQ
        "-pix_fmt yuv422p10le", // Set pixel format to 10-bit
        "-bits_per_mb 8000", // Set bits per MB for ProRes (adjust as needed)
      ])
      .on("end", (stdout, stderr) => {
        console.log("Video conversion completed");
        res.download(__dirname + outputFile, function (err) {
          if (err) throw err;
          fs.unlink(__dirname + outputFile, function (err) {
            if (err) throw err;
            console.log("Output file deleted");
          });
          fs.unlink(inputFilePath, function (err) {
            if (err) throw err;
            console.log("Input file deleted");
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
      .saveToFile(__dirname + "output.mov"); // Save output file with same extension
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

module.exports = changeFormatTo16BitMOV;
