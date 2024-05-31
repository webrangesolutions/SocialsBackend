const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const archiver = require('archiver');

const processVideo = async (videoUrl, videoFormat, clips, res) => {
    try {
        console.log("clips are", clips);

        // Temporary directory to store trimmed videos
        const tempDir = await fs.promises.mkdtemp(path.join(fs.realpathSync('.'), 'trimmedVideos-'));

        const trimmedVideoPaths = [];

        // Process each clip
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const outputFilePath = path.join(tempDir, `clip_${i}.mp4`);
            await cutVideo(videoUrl, videoFormat, clip.from, clip.duration, outputFilePath);
            trimmedVideoPaths.push(outputFilePath);
        }

        // Create a ZIP archive of the trimmed videos
        const zipFilePath = path.join(tempDir, 'trimmedVideos.zip');
        await createZip(trimmedVideoPaths, zipFilePath);

        // Send the ZIP file as response
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="trimmedVideos.zip"');
        res.sendFile(zipFilePath, async (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send({
                    success: false,
                    data: { error: 'Error sending file' },
                });
            } else {
                // Delete the temporary directory after sending the files
                try {
                    await fs.promises.rmdir(tempDir, { recursive: true });
                    console.log('Temporary directory deleted:', tempDir);
                } catch (deleteErr) {
                    console.error('Error deleting temporary directory:', deleteErr);
                }
            }
        });
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
    return new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
            .setStartTime(startTime)
            .duration(duration)
            .format(videoFormat)
            .outputOptions('-movflags frag_keyframe+empty_moov')
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

// Create ZIP archive of files
const createZip = (files, zipFilePath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 },
        });

        output.on('close', () => {
            console.log(`${archive.pointer()} total bytes`);
            console.log('Archiver has been finalized and the output file descriptor has closed.');
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Append each file to the ZIP archive
        for (const file of files) {
            archive.file(file, { name: path.basename(file) });
        }

        archive.finalize();
    });
};

module.exports = processVideo;
