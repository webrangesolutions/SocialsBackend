// let ffmpeg = require("ffmpeg");
const ffmpeg = require("fluent-ffmpeg");
const https = require("https");
const path = require("path");
const fs = require("fs");

const {
  uploadFileToFirebase,
} = require("../../services/firebase/Firebase_post");

const extractFileName = (url) => {
  // Create a URL object from the string
  const urlObj = new URL(url);

  // Extract the pathname from the URL
  const pathname = urlObj.pathname;

  // Get the last part of the pathname after the last slash
  const lastPart = pathname.substring(pathname.lastIndexOf("/") + 1);

  // Decode the percent-encoded characters and return the filename
  return decodeURIComponent(lastPart);
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(`Failed to get '${url}' (${response.statusCode})`);
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err.message));
      });
  });
};

const changeCodec = async (file, codec, scanType, res) => {
  let fileName = extractFileName(file).split("/")[1];
  if(codec == 'prores' || codec == 'dnxhd'){
    fileName = 'output.mov'
  }
  const localFilePath = path.join(__dirname, "temp", fileName);
  const outputFilePath = path.join(__dirname, `temp/Output${fileName}`);

  let vcodec, options;

  if (codec === "hevc") {
    vcodec = "libx265";
    options = [
      "-vf",
      scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
      "-vf",
      "fps=50", // Set frame rate to 50
      "-s",
      "720x576", // Set resolution to PAL standard
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      "2M",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-c:v",
      "libx265",
      "-preset",
      "slow",
      "-crf",
      "28",
    ];
  } else if (codec === "h264") {
    vcodec = "libx264";
    options = [
      "-vf",
      scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
      "-vf",
      "fps=50", // Set frame rate to 50
      "-s",
      "720x576", // Set resolution to PAL standard
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      "2M",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "23",
    ];
  } else if (codec === "av1") {
    vcodec = "libaom-av1";
    options = [
      "-vf",
      scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
      '-vf', 'fps=50', // Set frame rate to 50
      "-s",
      "720x576", // Set resolution to PAL standard
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      "2M",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-c:v",
      "libaom-av1",
      "-cpu-used",
      "4",
      "-b:v",
      "0",
      "-crf",
      "30",
    ];
  } else if (codec === "dnxhd") {
    vcodec = "dnxhd";
    options = [
      "-vf",
      scanType === "Progressive" ? "yadif=1:-1:0,fps=50,scale=720:576:flags=lanczos" : "yadif=0:-1:1,fps=50,scale=720:576:flags=lanczos",
      "-pix_fmt",
      "yuv422p", // Use yuv422p for DNxHD
      "-b:v",
      "2M", // Adjust bitrate as needed
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-profile:v",
      "dnxhr_hq", // Example DNxHD profile, adjust as per your requirement
    ];
    
  } else if (codec === "prores") {
    vcodec = "prores_ks";
    options = [
      "-profile:v", "3",
      "-vf", scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1",
      "-vf", "fps=50",
      "-s", "720x576",
      "-pix_fmt", "yuv420p",
      "-b:v", "2M",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ac", "2", // Number of audio channels
      "-c:v", "prores_ks",
      "-ar", "48000",
      "-cpu-used", "4",
      "-b:v", "0", // Bitrate for video (set to 0 to use CRF)
      "-crf", "30", // Constant Rate Factor for quality (if using CRF mode)
    ];
    
  } else {
    return res.status(400).send({
      success: false,
      message: "Unsupported codec",
    });
  }

  try {
    await downloadFile(file, localFilePath);
    console.log(`Downloaded file to: ${localFilePath}`);

    await new Promise((resolve, reject) => {
      ffmpeg(localFilePath)
        .videoCodec(vcodec)
        .outputOptions(options)
        .on("start", (commandLine) => {
          console.log("ffmpeg process started with command:", commandLine);
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error occurred:", err.message);
          console.error("ffmpeg stdout:", stdout);
          console.error("ffmpeg stderr:", stderr);
          reject(err);
        })
        .on("end", () => {
          console.log("Processing done:", outputFilePath);
          resolve();
        })
        .save(outputFilePath);
    });

    console.log(`Uploading file to Firebase: ${outputFilePath}`);
    const uploadedFile = await uploadFileToFirebase(
      outputFilePath,
      `${fileName}`
    );

    res.status(200).send({
      success: true,
      videoUrl: uploadedFile,
    });

    cleanUpFiles([localFilePath, outputFilePath]);
  } catch (error) {
    console.error("An error occurred: ", error);
    res.status(500).send({
      success: false,
      error: error.message,
    });

    cleanUpFiles([localFilePath, outputFilePath]);
  }
};

const cleanUpFiles = (files) => {
  files.forEach((file) => {
    fs.unlink(file, (err) => {
      if (err) console.error(`Failed to delete file: ${file}`, err);
    });
  });
};

module.exports = changeCodec;
