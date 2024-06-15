const fs = require('fs');
const path = require('path');
const axios = require('axios');

const downloadVideo = async (videoUrl, downloadPath) => {
    const writer = fs.createWriteStream(downloadPath);

    const response = await axios({
        url: videoUrl,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

module.exports = downloadVideo;
