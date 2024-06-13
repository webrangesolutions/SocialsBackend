const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const exportVideoSchema = new Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: true,
  },
  exportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  exportedFile: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
  },
  codec: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  expiry: {
    type: Date,
  },
  amount: {
    type: Number,
  },
  invoiceId: {
    type: String,
    unique: true,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidDate: {
    type: Date,
  },
});

// Function to generate a unique invoice ID
function generateInvoiceId() {
  const timestamp = Date.now().toString();
  return `INV-${timestamp}`;
}

// Pre-save middleware to set the expiry, amount, and invoiceId fields
exportVideoSchema.pre('save', function(next) {
  const currentDate = new Date();
  this.expiry = new Date(currentDate.setDate(currentDate.getDate() + 30)); // 30 days from now
  this.amount = 1 * this.duration; // Amount = 1 * duration

  // Generate and set invoiceId
  this.invoiceId = generateInvoiceId();
  next();
});

module.exports = mongoose.model("exportVideo", exportVideoSchema, "exportVideos");
