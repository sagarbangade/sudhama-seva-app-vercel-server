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
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'collected', 'skipped'],
    default: 'pending',
    required: true
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

// Create indexes for efficient querying
donationSchema.index({ status: 1 });
donationSchema.index({ collectionDate: 1 });
donationSchema.index({ collectedBy: 1 });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;