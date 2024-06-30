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
  try {
    // Temporary directory to store the downloaded video
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-"));
    const localFilePath = path.join(tempDir, "inputVideo.mp4");

    // Download the video file locally
    await downloadVideo(videoUrl, localFilePath);

    // Temporary directory to store the trimmed video
    // const realPath = await fs.realpath(".");
    // const tempTrimDir = await fs.mkdtemp(path.join(realPath, "trimmedVideo-"));

    const tempTrimDirPath = await fs.mkdir(path.join(await fs.realpath('.'), 'trimmedVideo'), { recursive: true }).then(() => path.join(await fs.realpath('.'), 'trimmedVideo'));
    const outputFilePath = path.join(tempTrimDirPath, "trimmedVideo.mp4");

    // Process the video clip
    await cutVideo(localFilePath, videoFormat, start, duration, outputFilePath);

    // Upload the trimmed video to Firebase
    const firebaseUrl = await uploadFileToFirebase(
      outputFilePath,
      "trimmedVideo.mp4"
    );

    // Send the Firebase video URL as response
    res.status(200).send({
      success: true,
      videoUrl: firebaseUrl,
      duration: duration,
    });

    // Cleanup: Delete the temporary files
    await fs.unlink(localFilePath);
    await fs.unlink(outputFilePath);
    await fs.rmdir(tempDir);
    await fs.rmdir(tempTrimDir);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      success: false,
      data: { error: error.message },
    });
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
      .duration(duration)
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

module.exports = processVideo;
