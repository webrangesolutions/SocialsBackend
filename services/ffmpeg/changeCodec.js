const ffmpeg = require("fluent-ffmpeg");
const https = require("https");
const path = require("path");
const fs = require("fs");

const { uploadFileToFirebase } = require("../../services/firebase/Firebase_post");

const extractFileName = (url) => {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const lastPart = pathname.substring(pathname.lastIndexOf("/") + 1);
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
  const datee = new Date();
  const date = datee.toISOString().replace(/[-:.TZ]/g, "");
  let fileNamee = extractFileName(file).split("/")[1];
  let fileExt = fileNamee.split(".")[1];
  console.log("file extension is...", fileExt)
  let fileName = `${date}.${fileExt}`;
  
  if (codec === 'prores' || codec === 'dnxhd') {
    fileName = `${date}.mov`;
  }

  const localFilePath = path.join(__dirname, "temp", fileName);
  const outputFilePath = path.join(__dirname, `temp/Output${fileName}`);

  let vcodec, options;

  if (codec === "hevc") {
    vcodec = "libx265";
    options = [
      "-vf",
      `${scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1"},fps=50`,
      "-s",
      "720x576",
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
      "-preset",
      "slow",
      "-crf",
      "28"
    ];
  } else if (codec === "h264") {
    vcodec = "libx264";
    options = [
      "-vf",
      `${scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1"},fps=50`,
      "-s",
      "720x576",
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
      "-preset",
      "slow",
      "-crf",
      "23"
    ];
  } else if (codec === "av1") {
    vcodec = "libaom-av1";
    options = [
      "-vf",
      `${scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1"},fps=50`,
      "-s",
      "720x576",
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
      "-cpu-used",
      "4",
      "-crf",
      "30"
    ];
  } else if (codec === "dnxhd") {
    vcodec = "dnxhd";
    options = [
      "-vf",
      `${scanType === "Progressive" ? "yadif=1:-1:0,fps=50,scale=720:576:flags=lanczos" : "yadif=0:-1:1,fps=50,scale=720:576:flags=lanczos"}`,
      "-pix_fmt",
      "yuv422p",
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
      "-profile:v",
      "dnxhr_hq"
    ];
  } else if (codec === "prores") {
    vcodec = "prores_ks";
    options = [
      "-profile:v",
      "3",
      "-vf",
      `${scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1"},fps=50`,
      "-s",
      "720x576",
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
      "-cpu-used",
      "4",
      "-crf",
      "30"
    ];
  } else {
    return res.status(400).send({
      success: false,
      message: "Unsupported codec"
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
    const uploadedFile = await uploadFileToFirebase(outputFilePath, `${fileName}`);

    res.status(200).send({
      success: true,
      videoUrl: uploadedFile
    });

    cleanUpFiles([localFilePath, outputFilePath]);
  } catch (error) {
    console.error("An error occurred: ", error);
    res.status(500).send({
      success: false,
      error: error.message
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
