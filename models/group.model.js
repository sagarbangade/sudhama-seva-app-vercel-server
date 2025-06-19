const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    unique: true,
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Area description is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes
groupSchema.index({ name: 1 }, { unique: true });
groupSchema.index({ area: 1 });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;