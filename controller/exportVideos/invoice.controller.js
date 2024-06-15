const Export = require("../../models/exportVideo.model");
const XLSX = require("xlsx");
const mongoose = require("mongoose");

const invoiceController = {
  async getInvoice(req, res) {
    let { id } = req.params;

    try {
      let query;
      if (id) {
        query = { userId: id, ...req.body };
      } else {
        query = { ...req.body };
      }

      const pipeline = [
        // Match documents based on the query criteria
        { $match: query },

        // Populate the 'post' field
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "post",
          },
        },
        { $unwind: "$post" },

        // Populate the 'post.userId' field
        {
          $lookup: {
            from: "users",
            localField: "post.userId",
            foreignField: "_id",
            as: "post.userId",
          },
        },
        { $unwind: "$post.userId" },

        // Project required fields including the status
        {
          $project: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: "$date",
                timezone: "UTC",
              },
            },
            expiry: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: "$expiry",
                timezone: "UTC",
              },
            },
            amount: 1,
            invoiceId: 1,
            isPaid: 1,
            status: {
              $cond: {
                if: { $eq: ["$isPaid", true] },
                then: "Paid",
                else: {
                  $cond: {
                    if: { $gt: ["$expiry", new Date()] },
                    then: "Pending",
                    else: "Overdue",
                  },
                },
              },
            },
            "post.video": 1,
            "post.date": 1,
            "post.duration": 1,
            "post.userId.name": 1,
            "post.userId.image": 1,
          },
        },

        // Stage to collect all invoices and calculate the total amount
        {
          $group: {
            _id: null,
            invoices: { $push: "$$ROOT" },
            totalAmount: { $sum: "$amount" },
          },
        },
      ];

      // Execute the first pipeline to get invoices and total amount
      const result = await Export.aggregate(pipeline);

      // Extract invoices and total amount
      const invoices = result.length ? result[0].invoices : [];
      const totalAmount = result.length ? result[0].totalAmount : 0;

      // Calculate pending amount in a separate aggregation
      const pendingPipeline = [
        { $match: query },
        { $match: { isPaid: false } },
        { $group: { _id: null, pendingAmount: { $sum: "$amount" } } },
      ];

      const pendingResult = await Export.aggregate(pendingPipeline);

      // Extract pending amount
      const pendingAmount = pendingResult.length
        ? pendingResult[0].pendingAmount
        : 0;

      return res.status(200).send({
        success: true,
        data: {
          message: "Invoices Found",
          invoices: invoices,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          pendingAmount: Number(pendingAmount.toFixed(2)),
        },
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  // ...................... mark paid ...........................
  async markPaid(req, res) {
    try {
      let { id } = req.params;

      let query;
      if (id) {
        query = { invoiceId: id, isPaid: false };
      } else {
        query = { isPaid: false };
      }
      const result = await Export.updateMany(query, {
        $set: { isPaid: true, paidDate: Date.now() },
      });

      if (result.nModified > 0) {
        return res.status(200).send({
          success: true,
          message: "Paid Successfully",
        });
      } else {
        return res.status(200).send({
          success: true,
          message: "No pending payments to update",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        data: { error: error.message },
      });
    }
  },
  // ...................... get wallet ...........................
  async getWallet(req, res) {
    const { userId } = req.params;

    try {
      const pipeline = [
        // Lookup and populate the 'post' field
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "post",
          },
        },
        { $unwind: "$post" },

        // Further match the userId after the lookup stage
        { $match: { "post.userId": mongoose.Types.ObjectId(userId) } },

        // Lookup and populate the 'post.userId' field
        {
          $lookup: {
            from: "users",
            localField: "post.userId",
            foreignField: "_id",
            as: "post.userId",
          },
        },
        { $unwind: "$post.userId" },

        // Project required fields
        {
          $project: {
            date: 1,
            expiry: 1,
            amount: 1,
            invoiceId: 1,
            isPaid: 1,
            paidDate: 1,
            "post.video": 1,
            "post.date": 1,
            "post.duration": 1,
            "post.userId.name": 1,
            "post.userId.image": 1,
          },
        },

        // Stage to collect all invoices and calculate the total amount
        {
          $group: {
            _id: null,
            invoices: { $push: "$$ROOT" },
            totalAmount: { $sum: "$amount" },
          },
        },
      ];

      // Execute the first pipeline to get invoices and total amount
      const result = await Export.aggregate(pipeline);

      // Extract invoices and total amount
      const invoices = result.length ? result[0].invoices : [];
      const totalAmount = result.length ? result[0].totalAmount : 0;

      // Calculate pending amount in a separate aggregation
      const pendingPipeline = [
        { $match: { "post.userId": mongoose.Types.ObjectId(userId) } },
        { $match: { isPaid: false } },
        { $group: { _id: null, pendingAmount: { $sum: "$amount" } } },
      ];

      const pendingResult = await Export.aggregate(pendingPipeline);

      // Extract pending amount
      const pendingAmount = pendingResult.length
        ? pendingResult[0].pendingAmount
        : 0;

      return res.status(200).send({
        success: true,
        data: {
          message: "Invoices Found",
          invoices: invoices,
          totalAmount: totalAmount,
          pendingAmount: pendingAmount,
        },
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  // ...................... export csv ...........................
  async exportCsv(req, res) {
    let { id } = req.params;

    let query;
    if (id) {
      query = { userId: id, ...req.body };
    } else {
      query = { ...req.body };
    }

    try {
      console.log("in export csv");
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: "posts", // Replace with your actual posts collection name
            localField: "post", // Field in videoExport collection
            foreignField: "_id",
            as: "postDetails",
          },
        },
        {
          $unwind: "$postDetails",
        },
        {
          $lookup: {
            from: "users", // Replace with your actual users collection name
            localField: "postDetails.userId", // Field in posts collection
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $lookup: {
            from: "paymentMethods", // Replace with your actual payment methods collection name
            localField: "userDetails._id", // Field in users collection
            foreignField: "userId", // Field in paymentMethods collection
            as: "paymentDetails",
          },
        },
        {
          $unwind: "$paymentDetails",
        },
        {
          $project: {
            sortCode: "$paymentDetails.sortCode",
            accName: "$paymentDetails.accName",
            accNumber: "$paymentDetails.accNumber",
            amount: "$amount",
            invoiceId: "$invoiceId",
            bacsCode: "$paymentDetails.bacsCode",
          },
        },
      ];

      // Execute the aggregation pipeline
      const invoices = await Export.aggregate(pipeline);
      console.log("results are..", invoices);

      // Create a new workbook and a worksheet from the invoices JSON data
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(invoices, {
        origin: "A1", // Start from the first cell
        skipHeader: true,
      });

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");

      // Write the workbook to a buffer as a CSV file
      const buffer = XLSX.write(wb, { bookType: "csv", type: "buffer" });

      // Set the response header to prompt a file download
      res.attachment("Invoices.csv");
      return res.send(buffer);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};

module.exports = invoiceController;
