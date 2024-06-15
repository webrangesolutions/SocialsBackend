const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { storage } = require('../../configurations/FirebaseServiceAccountKey');
const fs = require('fs');

const uploadFileToFirebase = (filePath, destFileName) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `uploads/${destFileName}`);
        const fileBuffer = fs.readFileSync(filePath);
        
        uploadBytes(storageRef, fileBuffer, { contentType: 'video/mp4' })
            .then(() => {
                return getDownloadURL(storageRef);
            })
            .then((publicUrl) => {
                console.log('File uploaded successfully. URL:', publicUrl);
                resolve(publicUrl);
            })
            .catch((err) => {
                console.error('Error uploading file to Firebase:', err);
                reject(err);
            });
    });
};

module.exports = {
    uploadFileToFirebase
};
