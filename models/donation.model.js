const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  collectionDate: {
    type: Date,
    required: [true, 'Collection date is required']
  },
  collectionMonth: {
    type: String,  // Format: "YYYY-MM"
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'collected', 'skipped'],
    default: 'pending'
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create compound index to ensure one donation per donor per month
donationSchema.index({ donor: 1, collectionMonth: 1 }, { unique: true });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;