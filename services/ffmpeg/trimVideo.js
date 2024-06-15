const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { uploadFileToFirebase } = require("../../services/firebase/Firebase_post");

const processVideo = async (videoUrl, videoFormat, start, duration, req, res) => {
    try {

        // Temporary file to store the trimmed video
        const tempDir = await fs.promises.mkdtemp(path.join(fs.realpathSync('.'), 'trimmedVideo-'));
        const outputFilePath = path.join(tempDir, 'trimmedVideo.mp4');

        // Process the video clip
        await cutVideo(videoUrl, videoFormat, start, duration, outputFilePath);

        // Upload the trimmed video to Firebase
        const firebaseUrl = await uploadFileToFirebase(outputFilePath, 'trimmedVideo.mp4');

        // Send the Firebase video URL as response
        res.status(200).send({
            success: true,
            videoUrl: firebaseUrl,
            duration: duration
        });

        // Delete the temporary file
        try {
            await fs.promises.rmdir(tempDir, { recursive: true });
        } catch (deleteErr) {
            console.error('Error deleting temporary directory:', deleteErr);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({
            success: false,
            data: { error: error.message },
        });
    }
};

// Cut video and save to outputFilePath
const cutVideo = (videoUrl, videoFormat, startTime, duration, outputFilePath) => {
    let vcodec = 'libx264';
    let options = [
        '-c:v libx264', // Use H.264 codec
        '-preset slow', // Encoding speed (can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
        '-crf 23' // Constant Rate Factor for quality (lower is better quality, 0 is lossless)
    ];
    return new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
            .setStartTime(startTime)
            .duration(duration)
            .format(videoFormat)
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
