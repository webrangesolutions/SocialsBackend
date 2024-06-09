const Export = require("../../models/exportVideo.model");
const mongoose = require("mongoose");
const path = require("path");

const exporttController = {
  async createExport(req, res) {
    let exporttData = req.body;
    const { size } = req.metadata;
    const { fileUrl, videoFormat, videoCodec } = req;

    // If you want to log size in other units
    const sizeInKB = size / 1024;
    const sizeInMB = sizeInKB / 1024;
    exporttData.exportedFile = fileUrl;
    exporttData.fileSize = sizeInMB;
    exporttData.codec = videoCodec;
    exporttData.format = videoFormat;

    const exportt = new Export(exporttData);

    try {
      exportt.save();
      res.status(200).send({
        message: "video exported successfully",
        data: exportt,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  async generateLink(req, res) {
    const { fileUrl } = req;

    try {
      res.status(200).send({
        message: "link generated successfully",
        link: fileUrl,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  async getUserExport(req, res) {
    const userId = mongoose.Types.ObjectId(req.params.id);
    try {
      const exports = await Export.aggregate([
        // Match export videos where the post userId matches the requested userId
        {
          $match: {
            exportedBy: userId,
          },
        },
        // Populate the 'post' field
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "post",
          },
        },
        // Unwind the 'post' array to get individual post documents
        {
          $unwind: "$post",
        },
        // Populate the 'exportedBy' field
        {
          $lookup: {
            from: "users",
            localField: "exportedBy",
            foreignField: "_id",
            as: "exportedBy",
          },
        },
        // Unwind the 'exportedBy' array to get individual user documents
        {
          $unwind: "$exportedBy",
        },

         // Project the desired fields
      {
        $project: {
          _id: 0,
          "postId": "$post._id",
          "videoTitle": "$post.title",
          "videoURL": "$post.video",
          "duration": "$duration",
          "userName": "$exportedBy.name",
          "userId": "$exportedBy._id",
        }
      }
      ]);

      res.status(200).json({
        success: true,
        data: { message: "Exports found", exports },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

};

module.exports = exporttController;

// router.exportt("/login", async (req, res) => {
// });
