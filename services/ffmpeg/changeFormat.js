const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Set the paths for ffmpeg and ffprobe
const ffmpegPath = path.resolve(__dirname, '../../ffmpeg-2024-06-13-git-0060a368b1-full_build/bin/ffmpeg.exe');
const ffprobePath = path.resolve(__dirname, '../../ffmpeg-2024-06-13-git-0060a368b1-full_build/bin/ffprobe.exe');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const changeFormat = async (file, format, res) => {
  try {
    const inputFilePath = path.join('uploads', file);
    const outputFile = 'output.' + format;

    console.log('Converting', path.extname(file), 'to', format);

    // Check if the input file exists
    if (!fs.existsSync(inputFilePath)) {
      throw new Error('Input file does not exist');
    }

    // Convert MXF to MOV using FFmpeg's basic mode
    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions(['-c:v libx264', '-c:a aac']) // Properly format the options
        .withOutputFormat(format)
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing:', progress);
        })
        .on('end', () => {
          console.log('Conversion to MOV completed');
          res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlink(outputFile, (err) => {
              if (err) throw err;
              console.log('Output file deleted');
            });
            fs.unlink(inputFilePath, (err) => {
              if (err) throw err;
              console.log('Input file deleted');
            });
          });
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error occurred during conversion:', err.message);
          console.error('FFmpeg stdout:', stdout);
          console.error('FFmpeg stderr:', stderr);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error occurred during video conversion',
              ffmpegError: err.message,
              ffmpegStdout: stdout,
              ffmpegStderr: stderr,
            });
          }
          reject(err);
        })
        .save(outputFile);
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
};

module.exports = changeFormat;
