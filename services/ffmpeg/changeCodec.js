// const fs = require('fs');
// const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// const { uploadFileToFirebase } = require("../../services/firebase/Firebase_post");

// const processVideo = async (videoUrl, videoFormat, codec, res) => {
//   let tempDir;

//   try {
//       // Validate video URL and format
//       if (!videoUrl || !videoFormat) {
//           throw new Error("Missing video URL or format.");
//       }

//       // Temporary directory to store the trimmed video
//       tempDir = await fs.promises.mkdtemp(path.join(fs.realpathSync('.'), 'trimmedVideo-'));
//       const outputFilePath = path.join(tempDir, `trimmedVideo.${videoFormat}`);

//       // Process the video clip
//       await changeCodec(videoUrl, videoFormat, codec, outputFilePath);

//       // Upload the trimmed video to Firebase
//       const firebaseUrl = await uploadFileToFirebase(outputFilePath, `trimmedVideo.${videoFormat}`);

//       // Send the Firebase video URL as response
//       res.status(200).send({
//           success: true,
//           videoUrl: firebaseUrl,
//       });
//   } catch (error) {
//       console.error('Error:', error);
//       res.status(500).send({
//           success: false,
//           data: { error: error.message },
//       });
//   } finally {
//       // Delete the temporary directory after processing
//       if (tempDir) {
//           try {
//               await fs.promises.rmdir(tempDir, { recursive: true });
//               console.log('Temporary directory deleted:', tempDir);
//           } catch (deleteErr) {
//               console.error('Error deleting temporary directory:', deleteErr);
//           }
//       }
//   }
// };

// // Function to change codec and save to outputFilePath
// const changeCodec = (videoUrl, videoFormat, codec, outputFilePath) => {
//     let vcodec, options;

//     if (codec === "hevc") {
//         vcodec = "libx265";
//         options = [
//             "-c:v", "libx265",    // Use HEVC codec
//             "-preset", "slow",    // Encoding speed
//             "-crf", "28"          // Constant Rate Factor for quality
//         ];
//     } else if (codec === 'h264') {
//         vcodec = 'libx264';
//         options = [
//             "-c:v", "libx264",    // Use H.264 codec
//             "-preset", "slow",    // Encoding speed
//             "-crf", "23"          // Constant Rate Factor for quality
//         ];
//     } else if (codec === 'av1') {
//         vcodec = 'libaom-av1';
//         options = [
//             "-c:v", "libaom-av1", // Use AV1 codec
//             "-cpu-used", "4",     // Set CPU usage
//             "-b:v", "0",          // Use constant quality mode
//             "-crf", "30"          // Constant Rate Factor for quality
//         ];
//     }

//     return new Promise((resolve, reject) => {
//         ffmpeg(videoUrl)
//             .withOutputFormat(videoFormat)

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
  const fileName = extractFileName(file).split("/")[1];
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
      // '-vf', 'fps=50', // Set frame rate to 50
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
      scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
      // '-vf', 'fps=50', // Set frame rate to 50
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
      "-cpu-used",
      "4",
      "-b:v",
      "0",
      "-crf",
      "30",
    ];
  } else if (codec === "prores") {
    vcodec = "prores_ks";
    options = [
      "-profile:v",
      "3",
      "-vf",
      scanType === "Progressive" ? "yadif=1:-1:0" : "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
      // '-vf', 'fps=50', // Set frame rate to 50
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
      "-cpu-used",
      "4",
      "-b:v",
      "0",
      "-crf",
      "30",
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
