const multer = require("multer");
const { ref, uploadBytes, getDownloadURL, getMetadata } = require("firebase/storage");
const { storage } = require("../../configurations/FirebaseServiceAccountKey");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const os = require("os");
const path = require("path");

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage, limits: { fileSize: 100 * 1024 * 1024 } // 100 MB });

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const uploadFileToFirebase = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send({ success: false, message: "No file uploaded" });
    }

    // Extract file format from the file name
    const format = path.extname(req.file.originalname);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, req.file.buffer, {
      contentType: req.file.mimetype,
    }).catch((uploadError) => {
      throw new Error("Failed to upload file to Firebase");
    });

    const publicUrl = await getDownloadURL(storageRef).catch((urlError) => {
      throw new Error("Failed to get download URL from Firebase");
    });

    // Get video metadata from Firebase
    const metadata = await getMetadata(storageRef).catch((metadataError) => {
      throw new Error("Failed to get metadata from Firebase");
    });

    // Get the temporary directory path
    const tempDir = os.tmpdir();
    const localFilePath = path.join(tempDir, fileName);

    // Temporarily save the uploaded file to a local path
    await fs.promises.writeFile(localFilePath, req.file.buffer).catch((fileError) => {
      throw new Error("Failed to save file locally");
    });

    // Get format and codec information using fluent-ffmpeg
    ffmpeg.ffprobe(localFilePath, (err, videoMetadata) => {
      if (err) {
        return res.status(500).send({ message: "Failed to retrieve video metadata" });
      }

      const codec = videoMetadata.streams[0].codec_name;

      // Clean up the temporary file
      fs.unlinkSync(localFilePath);

      req.fileUrl = publicUrl;
      req.metadata = metadata;
      req.videoFormat = format;
      req.videoCodec = codec;
      
    
      next();
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to handle file upload", error: error.message });
  }
};

module.exports = { upload, uploadFileToFirebase };
