const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const fetch = require("node-fetch");
const os = require("os");
const {
  uploadFileToFirebase,
} = require("../../services/firebase/Firebase_post");

const processVideo = async (
  videoUrl,
  videoFormat,
  start,
  duration,
  req,
  res
) => {
  const filesToDelete = []; // Array to keep track of temporary files
  try {
    const datee = new Date();
    const date = datee.toISOString().replace(/[-:.TZ]/g, "");

    console.log("start is...", start, "... duration is ...", duration);
    const fileName = `${date}.mp4`;

    // Temporary directory to store the downloaded video
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-"));
    // filesToDelete.push(tempDir);

    const localFilePath = path.join(tempDir, fileName);
    const outputFilePath = path.join(tempDir, `Output${fileName}`);
    filesToDelete.push(localFilePath, outputFilePath);

    // Download the video file locally
    await downloadVideo(videoUrl, localFilePath);

    // Process the video clip
    await cutVideo(localFilePath, videoFormat, start, duration, outputFilePath);

    // Upload the trimmed video to Firebase
    const firebaseUrl = await uploadFileToFirebase(outputFilePath, fileName);

    // Send the Firebase video URL as response
    res.status(200).send({
      success: true,
      videoUrl: firebaseUrl,
      duration: duration - start,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      success: false,
      data: { error: error.message },
    });
  } finally {
    // Cleanup: Delete the temporary files
    await cleanupFiles(filesToDelete);
  }
};

// Download video from URL to localFilePath
const downloadVideo = async (videoUrl, localFilePath) => {
  const response = await fetch(videoUrl); // Assuming fetch is available
  const videoStream = response.body;
  const fileStream = fsSync.createWriteStream(localFilePath);

  return new Promise((resolve, reject) => {
    videoStream.pipe(fileStream);
    videoStream.on("end", () => {
      console.log("Video downloaded:", localFilePath);
      resolve();
    });
    videoStream.on("error", (err) => {
      reject(err);
    });
  });
};

// Cut video and save to outputFilePath
const cutVideo = (
  inputFilePath,
  videoFormat,
  startTime,
  duration,
  outputFilePath
) => {
  let vcodec = "libx264";
  let options = [
    "-c:v",
    "libx264", // Use H.264 codec
    "-preset",
    "slow", // Encoding speed (can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
    "-crf",
    "23", // Constant Rate Factor for quality (lower is better quality, 0 is lossless)

    "-vf",
    "yadif=0:-1:1", // yadif filter for deinterlacing or progressive
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
  ];
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setStartTime(startTime)
      .duration(duration - startTime)
      .format(videoFormat)
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
};

const cleanupFiles = async (files) => {
  for (const file of files) {
    try {
      const stat = await fs.lstat(file);
      if (stat.isDirectory()) {
        await fs.rm(file, { recursive: true, force: true });
      } else {
        await fs.unlink(file);
      }
      console.log(`Deleted file: ${file}`);
    } catch (err) {
      console.error(`Failed to delete file: ${file}`, err);
    }
  }
};

module.exports = processVideo;
