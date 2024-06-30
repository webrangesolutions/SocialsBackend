// let ffmpeg = require("ffmpeg");
const https = require("https");
const path = require("path");
const fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");

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

const changeFormat = async (file, format, scanType,res) => {
  try {

    console.log("file is ...", file, "... format is ...", format," ... ")
    const fileName = extractFileName(file).split("/")[1];
   // const localFilePath = path.join(__dirname, "temp", fileName);
//   const tempTrimDir = path.join(fs.realpathSync('.'), 'trimmedVideo-')
  //  const localFilePath = path.join(tempTrimDir, "trimmedVideo.mp4");

        const tempTrimDirPath = path.join(await fs.realpath('.'), 'trimmedVideo');

    const localFilePath = path.join(tempTrimDirPath, "trimmedVideo.mp4");


    const outputFilePath = path.join(__dirname, "temp", `output.${format}`);

    // console.log("local...",localFilePath,"...output...", outputFilePath )

    // Ensure the temp directory exists
    if (!fs.existsSync(path.join(__dirname, "temp"))) {
      fs.mkdirSync(path.join(__dirname, "temp"));
    }

    // Download the file
    await downloadFile(file, localFilePath);
    // console.log(`Downloaded file to: ${localFilePath}`);

    // Convert the file format
    ffmpeg(localFilePath)
  
      .output(outputFilePath)
      .outputFormat(format)
      .outputOptions([
        '-vf', scanType === 'Progressive' ? 'yadif=1:-1:0': 'yadif=0:-1:1' , // yadif filter for deinterlacing or progressive
        // '-vf', 'fps=50', // Set frame rate to 50
        // '-s', '720x576', // Set resolution to PAL standard
        // '-pix_fmt', 'yuv420p',
        // '-c:v', 'libx264',
        // '-b:v', '2M',
        // '-c:a', 'aac',
        // '-b:a', '128k',
        // '-ac', '2',
        // '-ar', '48000'
      ])
      .on('start', function (commandLine) {
        console.log('Spawned FFmpeg with command: ' + commandLine);
      })
      .on('error', function (err) {
        console.error('An error occurred during conversion: ' + err.message);
        cleanupFiles(localFilePath, outputFilePath);
        res.status(500).send({
          success: false,
          error: err.message,
        });
      })
      .on('end', async function () {
        console.log('Processing finished successfully');
        try {
          const uploadedFile = await uploadFileToFirebase(outputFilePath, `output.${format}`);
          res.status(200).send({
            success: true,
            videoUrl: uploadedFile,
          });
        } catch (uploadErr) {
          console.error('Error uploading file: ', uploadErr);
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
    console.error('An error occurred: ', error);
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

const cleanupFiles = (localFilePath, outputFilePath) => {
  fs.unlink(localFilePath, (err) => {
    if (err) console.error('Error deleting local file: ', err);
  });
  fs.unlink(outputFilePath, (err) => {
    if (err) console.error('Error deleting output file: ', err);
  });
};


// const changeFormat = async (file, format, res) => {
//   const fileName = extractFileName(file).split("/")[1];
//   const localFilePath = path.join(__dirname, "temp", fileName);
//   const outputFilePath = path.join(__dirname, `output.${format}`);

//   // fs.unlink(outputFilePath, (err) => {
//   //   if (err)
//   //     console.error("Failed to delete local file:", err);
//   // });

//   try {
//     downloadFile(file, localFilePath).then(() => {
//       try {
//         //make sure you set the correct path to your video file
//         var proc = new ffmpeg({ source: localFilePath, nolog: true });
//         // proc.setFfmpegPath(
//         //   "D:\\documents\\React\\backendd\\socials\\socials-backend\\ffmpeg\\bin"
//         // );

//         proc

//           // set output format to force
//           .toFormat(format)

//           // setup event handlers
//           .on("end", function () {
//             console.log("file has been converted successfully");
//           })

//           .on("error", function (err) {
//             console.log("an error happened: " + err.message);
//             res.status(404).send({
//               success: false,
//               videoUrl: err.message,
//             });
//           })

//           // save to file <-- the new file I want -->
//           .saveToFile(outputFilePath, function (err) {
//             if (err) {
//               res.status(404).send({
//                 success: false,
//                 videoUrl: err,
//               });
//             }else{
//               const firebaseUrl = uploadFileToFirebase(
//                             outputFilePath,
//                             "output." + format
//                           )
//                             .then((file) => {
//                               res.status(200).send({
//                                 success: true,
//                                 videoUrl: file,
//                               });

//                               fs.unlink(outputFilePath, (err) => {
//                                 if (err)
//                                   console.error("Failed to delete local file:", err);
//                               });

//                               fs.unlink(localFilePath, (err) => {
//                                 if (err)
//                                   console.error("Failed to delete local file:", err);
//                               });
//                             })
//                             .catch((err) => {
//                               res.status(400).send({
//                                 success: false,
//                                 videoUrl: null,
//                               });

//                               fs.unlink(outputFilePath, (err) => {
//                                 if (err)
//                                   console.error("Failed to delete local file:", err);
//                               });

//                               fs.unlink(localFilePath, (err) => {
//                                 if (err)
//                                   console.error("Failed to delete local file:", err);
//                               });
//                             });

//                           console.log("Video file: " + file);
//                         }
//           });

//         // var process = new ffmpeg(localFilePath);
//         // process.then(
//         //   function (video) {
//         //     console.log("File downloaded:", localFilePath);
//         //     video
//         //       .setVideoFormat(format)
//         //       .save(outputFilePath, function (error, file) {
//         //         if (!error) {
//         //           const firebaseUrl = uploadFileToFirebase(
//         //             outputFilePath,
//         //             "output." + format
//         //           )
//         //             .then((file) => {
//         //               res.status(200).send({
//         //                 success: true,
//         //                 videoUrl: file,
//         //               });

//         //               fs.unlink(outputFilePath, (err) => {
//         //                 if (err)
//         //                   console.error("Failed to delete local file:", err);
//         //               });

//         //               fs.unlink(localFilePath, (err) => {
//         //                 if (err)
//         //                   console.error("Failed to delete local file:", err);
//         //               });
//         //             })
//         //             .catch((err) => {
//         //               res.status(400).send({
//         //                 success: false,
//         //                 videoUrl: null,
//         //               });

//         //               fs.unlink(outputFilePath, (err) => {
//         //                 if (err)
//         //                   console.error("Failed to delete local file:", err);
//         //               });

//         //               fs.unlink(localFilePath, (err) => {
//         //                 if (err)
//         //                   console.error("Failed to delete local file:", err);
//         //               });
//         //             });

//         //           console.log("Video file: " + file);
//         //         } else {
//         //           console.log("error is", error);
//         //           res.status(400).send({
//         //             success: false,
//         //             videoUrl: null,
//         //             error:error
//         //           });
//         //         }
//         //       });
//         //   },
//         //   function (err) {
//         //     console.log("Error: " + err);
//         //     res.status(400).send({
//         //       success: false,
//         //       videoUrl: null,
//         //       error:err
//         //     });
//         //   }
//         // );
//       } catch (e) {
//         console.log(e.code);
//         console.log(e.msg);
//         res.status(400).send({
//           success: false,
//           videoUrl: null,
//           error: e.msg,
//         });
//       }
//     });
//   } catch (e) {
//     console.log(e.code);
//     console.log(e.msg);
//     res.status(400).send({
//       success: false,
//       videoUrl: null,
//       error: e.msg,
//     });
//   }
// };

module.exports = changeFormat;
