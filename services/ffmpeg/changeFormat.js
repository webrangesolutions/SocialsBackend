let ffmpeg = require("ffmpeg");
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

const changeFormat = async (file, format, res) => {
  const fileName = extractFileName(file).split("/")[1];
  const localFilePath = path.join(__dirname, "temp", fileName);
  const outputFilePath = path.join(__dirname, `output.${format}`);

  // fs.unlink(outputFilePath, (err) => {
  //   if (err)
  //     console.error("Failed to delete local file:", err);
  // });

  try {
    downloadFile(file, localFilePath).then(() => {
      try {
        var process = new ffmpeg(localFilePath);
        process.then(
          function (video) {
            console.log("File downloaded:", localFilePath);
            video
              .setVideoFormat(format)
              .save(outputFilePath, function (error, file) {
                if (!error) {
                  const firebaseUrl = uploadFileToFirebase(
                    outputFilePath,
                    "output." + format
                  )
                    .then((file) => {
                      res.status(200).send({
                        success: true,
                        videoUrl: file,
                      });

                      fs.unlink(outputFilePath, (err) => {
                        if (err)
                          console.error("Failed to delete local file:", err);
                      });

                      fs.unlink(localFilePath, (err) => {
                        if (err)
                          console.error("Failed to delete local file:", err);
                      });
                    })
                    .catch((err) => {
                      res.status(400).send({
                        success: false,
                        videoUrl: null,
                      });

                      fs.unlink(outputFilePath, (err) => {
                        if (err)
                          console.error("Failed to delete local file:", err);
                      });

                      fs.unlink(localFilePath, (err) => {
                        if (err)
                          console.error("Failed to delete local file:", err);
                      });
                    });

                  console.log("Video file: " + file);
                } else {
                  console.log("error is", error);
                  res.status(400).send({
                    success: false,
                    videoUrl: null,
                    error:error
                  });
                }
              });
          },
          function (err) {
            console.log("Error: " + err);
            res.status(400).send({
              success: false,
              videoUrl: null,
              error:err
            });
          }
        );
      } catch (e) {
        console.log(e.code);
        console.log(e.msg);
        res.status(400).send({
          success: false,
          videoUrl: null,
          error:e.msg
        });
      }
    });
  } catch (e) {
    console.log(e.code);
    console.log(e.msg);
     res.status(400).send({
          success: false,
          videoUrl: null,
          error:e.msg
        });
  }
};

module.exports = changeFormat;
