const mailService = require("../../services/mailGrid/mailService");
const Email = require("../../models/emailVerification.model");

const emailVerificationController = {
  // ......................send emailVerification .............................
  async sendLinkToEmail(req, res, next) {
    try {
      const emailVerification = req.body;
      if (!emailVerification.email) {
        return res.status(400).json({
          success: false,
          data: { error: "Email not provided" },
        });
      }

      const emailExists = await Email.findOne({
        email: emailVerification.email,
      });

      let email = false;
      const issueDate = new Date();

      // Calculate the expiry date (3 days after today's date)
      const expiryDate = new Date(issueDate);
      expiryDate.setDate(expiryDate.getDate() + 3);
      emailVerification.expiryDate = expiryDate;

      if (emailExists) {
        email = await Email.findOneAndUpdate(
          { email: req.body.email },
          { issueDate, expiryDate },
          { new: true }
        );

        if (email) {
          console.log("Email updated:", email.email);
        } else {
          console.log("Email not found for updating");
        }
      } else {
        email = new Email(emailVerification);
        const link = await email.save();
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          data: { error: "Some error occurred ", email },
        });
      } else {
        // Send OTP email
        await mailService.sendEmail({
          sender: process.env.EMAIL,
          to: emailVerification.email,
          subject: "Email Verification Link",
          html: `<p>You can edit video using ${process.env.Email_Link}${email._id}. This link is only valid for the next 3 days.</p>`,
          attachments: [],
        });

        return res.status(200).json({
          success: true,
          data: { message: "Mail Sent Successfully!" },
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.message },
      });
    }
  },

  // ......................update Duration .............................
  async updateDuration(req, res, next) {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;

      if (!expiryDate) {
        return res.status(400).json({
          success: false,
          data: { error: "Expiry Date not provided" },
        });
      }

      const updatedEmail = await Email.findOneAndUpdate(
        { _id: id },
        { expiryDate },
        { new: true }
      );

      if (!updatedEmail) {
        return res.status(404).json({
          success: false,
          data: { error: "Email not found" },
        });
      }

      return res.status(200).json({
        success: true,
        data: { message: "Expiry Date updated successfully!" },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.message },
      });
    }
  },

  // ......................check link .............................
  async checkLink(req, res, next) {
    try {
      const { id } = req.params;

      const emailFound = await Email.findOne({ _id: id });
      const now = new Date();

      if (!emailFound) {
        return res.status(404).json({
          success: false,
          data: { error: "link not found" },
        });
      } else if (emailFound.expiryDate && emailFound.expiryDate >= now) {
        return res.status(200).json({
          success: true,
          data: { message: "Link Found" },
        });
      } else {
        return res.status(404).json({
          success: false,
          data: { error: "Your link is expired" },
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.message },
      });
    }
  },

   // ......................get editors .............................
   async getEditors(req, res, next) {
    try {
      const editors = await Email.find();

      if (editors.length == 0) {
        return res.status(404).json({
          success: false,
          data: { error: "No edotor found" },
        });
      } else {
        return res.status(200).json({
          success: true,
          data: { message: "Editors found", editors: editors },
        });
      } 
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.message },
      });
    }
  },
};

module.exports = emailVerificationController;
