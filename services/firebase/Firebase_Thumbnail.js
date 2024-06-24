const multer = require('multer');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { storage } = require('../../configurations/FirebaseServiceAccountKey');

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
   });

const uploadFilesToFirebase = async (req, res, next) => {
  try {
    if (!req.files['file'] || !req.files['thumbnail']) {
      throw new Error('File or thumbnail not uploaded');
    }

    // Upload file
    const file = req.files['file'][0];
    const fileName = `${Date.now()}_${file.originalname}`;
    const fileStorageRef = ref(storage, `uploads/${fileName}`);
    await uploadBytes(fileStorageRef, file.buffer, { contentType: file.mimetype });
    req.fileUrl = await getDownloadURL(fileStorageRef);

    // Upload thumbnail
    const thumbnail = req.files['thumbnail'][0];
    const thumbnailName = `${Date.now()}_${thumbnail.originalname}`;
    const thumbnailStorageRef = ref(storage, `uploads/${thumbnailName}`);
    await uploadBytes(thumbnailStorageRef, thumbnail.buffer, { contentType: thumbnail.mimetype });
    req.thumbnailUrl = await getDownloadURL(thumbnailStorageRef);

    next();
  } catch (error) {
    next(error);  // Pass the error to the next middleware
  }
};

module.exports = { upload, uploadFilesToFirebase };
