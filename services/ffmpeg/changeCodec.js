const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const convertToHEVC = async (file, codec, res) => {
  try {
    // Extract file extension from the input file
    const inputExt = path.extname(file);

    console.log("File is", file, codec);
    let outputFile = "output" + inputExt;
    let inputFilePath = path.join("uploads", file);

    let vcodec, options;
    if (codec == "hevc") {
      vcodec = "libx265";
      options = [
        "-c:v libx265", // Use HEVC codec
        "-preset slow", // Encoding speed (can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
        "-crf 28", // Constant Rate Factor for quality (lower is better quality, 0 is lossless)
      ];
    }
    else if(codec == 'h264'){
      vcodec = 'libx264';
      options = [
        '-c:v libx264', // Use H.264 codec
          '-preset slow', // Encoding speed (can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
          '-crf 23' // Constant Rate Factor for quality (lower is better quality, 0 is lossless)
          ];
    } else if(codec == 'av1'){
      vcodec = 'libaom-av1';
      options = [
        '-c:v libaom-av1', // Use AV1 codec
        '-cpu-used 4', // Set CPU usage (0-8, higher values may improve quality but increase encoding time)
        '-b:v 0', // Use constant quality mode
        '-crf 30' // Constant Rate Factor for quality (lower is better quality, 0 is lossless)
      ]
    }
  
    // Convert the video format using ffmpeg and stream it directly to the response
    ffmpeg(inputFilePath)
      .videoCodec(vcodec) // Use the HEVC codec
      .outputOptions(options)
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
      .saveToFile(__dirname + "output" + inputExt); // Save output file with same extension
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

module.exports = convertToHEVC;
