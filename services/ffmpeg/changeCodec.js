const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { uploadFileToFirebase } = require("../../services/firebase/Firebase_post");

const processVideo = async (videoUrl, videoFormat, codec, res) => {
  let tempDir;

  try {
      // Validate video URL and format
      if (!videoUrl || !videoFormat) {
          throw new Error("Missing video URL or format.");
      }

      // Temporary directory to store the trimmed video
      tempDir = await fs.promises.mkdtemp(path.join(fs.realpathSync('.'), 'trimmedVideo-'));
      const outputFilePath = path.join(tempDir, `trimmedVideo.${videoFormat}`);

      // Process the video clip
      await changeCodec(videoUrl, videoFormat, codec, outputFilePath);

      // Upload the trimmed video to Firebase
      const firebaseUrl = await uploadFileToFirebase(outputFilePath, `trimmedVideo.${videoFormat}`);

      // Send the Firebase video URL as response
      res.status(200).send({
          success: true,
          videoUrl: firebaseUrl,
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send({
          success: false,
          data: { error: error.message },
      });
  } finally {
      // Delete the temporary directory after processing
      if (tempDir) {
          try {
              await fs.promises.rmdir(tempDir, { recursive: true });
              console.log('Temporary directory deleted:', tempDir);
          } catch (deleteErr) {
              console.error('Error deleting temporary directory:', deleteErr);
          }
      }
  }
};


// Function to change codec and save to outputFilePath
const changeCodec = (videoUrl, videoFormat, codec, outputFilePath) => {
    let vcodec, options;

    if (codec === "hevc") {
        vcodec = "libx265";
        options = [
            "-c:v", "libx265",    // Use HEVC codec
            "-preset", "slow",    // Encoding speed
            "-crf", "28"          // Constant Rate Factor for quality
        ];
    } else if (codec === 'h264') {
        vcodec = 'libx264';
        options = [
            "-c:v", "libx264",    // Use H.264 codec
            "-preset", "slow",    // Encoding speed
            "-crf", "23"          // Constant Rate Factor for quality
        ];
    } else if (codec === 'av1') {
        vcodec = 'libaom-av1';
        options = [
            "-c:v", "libaom-av1", // Use AV1 codec
            "-cpu-used", "4",     // Set CPU usage
            "-b:v", "0",          // Use constant quality mode
            "-crf", "30"          // Constant Rate Factor for quality
        ];
    }

    return new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
            // .withOutputFormat(videoFormat)
            
            .videoCodec(vcodec)
            .outputOptions(options)
            .on('start', (commandLine) => {
                console.log('ffmpeg process started with command:', commandLine);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error occurred:', err.message);
                console.error('ffmpeg stdout:', stdout);
                console.error('ffmpeg stderr:', stderr);
                reject(err);
            })
            .on('end', () => {
                console.log('Processing done:', outputFilePath);
                resolve();
            })
            .save(outputFilePath);
    });
};

module.exports = processVideo;
