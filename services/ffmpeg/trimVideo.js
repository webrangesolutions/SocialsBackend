// const fs = require('fs');
// const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// const { uploadFileToFirebase } = require("../../services/firebase/Firebase_post");

// const processVideo = async (videoUrl, videoFormat, start, duration, req, res) => {
//     try {

//         // Temporary file to store the trimmed video
//         const tempDir = await fs.promises.mkdtemp(path.join(fs.realpathSync('.'), 'trimmedVideo-'));
//         const outputFilePath = path.join(tempDir, 'trimmedVideo.mp4');

//         // Process the video clip
//         await cutVideo(videoUrl, videoFormat, start, duration, outputFilePath);

//         // Upload the trimmed video to Firebase
//         const firebaseUrl = await uploadFileToFirebase(outputFilePath, 'trimmedVideo.mp4');

//         // Send the Firebase video URL as response
//         res.status(200).send({
//             success: true,
//             videoUrl: firebaseUrl,
//             duration: duration
//         });

//         // Delete the temporary file
//         try {
//             await fs.promises.rmdir(tempDir, { recursive: true });
//         } catch (deleteErr) {
//             console.error('Error deleting temporary directory:', deleteErr);
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send({
//             success: false,
//             data: { error: error.message },
//         });
//     }
// };

// // Cut video and save to outputFilePath
// const cutVideo = (videoUrl, videoFormat, startTime, duration, outputFilePath) => {
//     let vcodec = 'libx264';
//     let options = [
//         '-c:v libx264', // Use H.264 codec
//         '-preset slow', // Encoding speed (can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
//         '-crf 23' // Constant Rate Factor for quality (lower is better quality, 0 is lossless)
//     ];
//     return new Promise((resolve, reject) => {
//         ffmpeg(videoUrl)
//             .setStartTime(startTime)
//             .duration(duration)
//             .format(videoFormat)
//             .videoCodec(vcodec)
//             .outputOptions(options)
//             .on('start', (commandLine) => {
//                 console.log('ffmpeg process started with command:', commandLine);
//             })
//             .on('error', (err, stdout, stderr) => {
//                 console.error('Error occurred:', err.message);
//                 console.error('ffmpeg stdout:', stdout);
//                 console.error('ffmpeg stderr:', stderr);
//                 reject(err);
//             })
//             .on('end', () => {
//                 console.log('Processing done:', outputFilePath);
//                 resolve();
//             })
//             .save(outputFilePath);
//     });
// };

// module.exports = processVideo;



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

const processVideo = async (file, videoFormat, start, duration, req, res) => {
  const fileName = extractFileName(file).split("/")[1];
  const localFilePath = path.join(__dirname, "temp", fileName);
  const outputFilePath = path.join(__dirname, `Output.${videoFormat}`);
  console.log("start ..", start, "duration..", duration, fileName)
  fs.unlink(outputFilePath, (err) => {
        if (err)
          console.error("Failed to delete local file:", err);
      });

  try {
    downloadFile(file, localFilePath).then(() => {
      try {
        var process = new ffmpeg(localFilePath);
        process.then(
          function (video) {
            console.log("File downloaded:", localFilePath);
            video
            .setVideoFormat(videoFormat)
            .setVideoStartTime(start)
            .setVideoDuration(duration-start)
              .save(outputFilePath, function (error, file) {
                if (!error) {
                  const firebaseUrl = uploadFileToFirebase(
                    outputFilePath,
                    "trimmedVideo." + videoFormat
                  )
                    .then((file) => {
                      res.status(200).send({
                        success: true,
                        videoUrl: file,
                        duration: duration - start
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

module.exports = processVideo;
