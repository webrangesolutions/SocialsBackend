const https = require("https");
const path = require("path");
const fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");

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

const changeFormat = async (file, format, scanType, res) => {
  try {
    const datee = new Date();
    const date = datee.toISOString().replace(/[-:.TZ]/g, "");
    console.log(date);
    console.log("date is", date);
    console.log("file is ...", file, "... format is ...", format, " ... ");
    const fileName = extractFileName(file);

    console.log("file name is ..", fileName);

    const tempTrimDirPath = path.join(await fs.realpathSync("."), "trimmedVideo");

    if (!fs.existsSync(tempTrimDirPath)) {
      fs.mkdirSync(tempTrimDirPath);
    }

    const localFilePath = path.join(tempTrimDirPath, `${date}.mp4`);
    const outputFilePath = path.join(__dirname, "temp", `${date}.${format}`);

    if (!fs.existsSync(path.join(__dirname, "temp"))) {
      fs.mkdirSync(path.join(__dirname, "temp"));
    }

    await downloadFile(file, localFilePath);

    ffmpeg(localFilePath)
      .output(outputFilePath)
      .outputFormat(format)
      .outputOptions([
        "-vf",
        scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1",
      ])
      .on("start", function (commandLine) {
        console.log("Spawned FFmpeg with command: " + commandLine);
      })
      .on("error", function (err) {
        console.error("An error occurred during conversion: " + err.message);
        cleanupFiles(localFilePath, outputFilePath);
        res.status(500).send({
          success: false,
          error: err.message,
        });
      })
      .on("end", async function () {
        console.log("Processing finished successfully");
        try {
          const uploadedFile = await uploadFileToFirebase(outputFilePath, `${date}.${format}`);
          res.status(200).send({
            success: true,
            videoUrl: uploadedFile,
          });
        } catch (uploadErr) {
          console.error("Error uploading file: ", uploadErr);
          res.status(500).send({
            success: false,
            error: uploadErr.message,
          });
        } finally {
          cleanupFiles(localFilePath, outputFilePath);
        }
      })
      .run();
  } catch (error) {
    console.error("An error occurred: ", error);
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

const cleanupFiles = (localFilePath, outputFilePath) => {
  fs.unlink(localFilePath, (err) => {
    if (err) console.error("Error deleting local file: ", err);
  });
  fs.unlink(outputFilePath, (err) => {
    if (err) console.error("Error deleting output file: ", err);
  });
};

module.exports = changeFormat;
