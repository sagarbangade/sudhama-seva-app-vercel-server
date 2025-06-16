const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  hundiNo: {
    type: String,
    required: [true, 'Hundi number is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  googleMapLink: {
    type: String,
    required: [true, 'Google Maps link is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
donorSchema.index({ hundiNo: 1 }, { unique: true });
donorSchema.index({ date: -1 }); // For sorting by date
donorSchema.index({ createdBy: 1 }); // For filtering by creator

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor; 