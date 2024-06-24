const multer = require('multer');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const { storage } = require('../../configurations/FirebaseServiceAccountKey');

const memoryStorage = multer.memoryStorage();

const upload = multer({ storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
   });


const uploadFileToFirebase = async (req, res, next) => {

  try {

    if (!req.file) {
      return res.status(400).send({ success: false, message: 'No file uploaded' });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    await uploadBytes(storageRef, req.file.buffer, { contentType: req.file.mimetype });
    const publicUrl = await getDownloadURL(storageRef);

    req.fileUrl = publicUrl;
    next();
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to handle file upload' });
  }
};

module.exports = { upload, uploadFileToFirebase };
