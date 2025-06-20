const { validationResult } = require('express-validator');
const Donor = require('../models/donor.model');
const { initializeDefaultGroups } = require('./group.controller');
const Group = require('../models/group.model');
const Donation = require('../models/donation.model');

// Helper function to check if donor has donation for current month
const hasDonationForCurrentMonth = async (donorId) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const existingDonation = await Donation.findOne({
    donor: donorId,
    collectionDate: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });

  return !!existingDonation;
};

// Create a new donor
exports.createDonor = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      hundiNo,
      name,
      mobileNumber,
      address,
      googleMapLink,
      collectionDate,
      group
    } = req.body;

    // Check if hundi number already exists
    const existingDonor = await Donor.findOne({ hundiNo });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: 'A donor with this hundi number already exists'
      });
    }

    // Initialize default groups if none exist
    const groupCount = await Group.countDocuments();
    if (groupCount === 0) {
      await initializeDefaultGroups(req.user.id);
    }

    // If no group specified, assign to Group A
    let groupId = group;
    if (!groupId) {
      const defaultGroup = await Group.findOne({ name: 'Group A' });
      if (!defaultGroup) {
        return res.status(500).json({
          success: false,
          message: 'Default group not found'
        });
      }
      groupId = defaultGroup._id;
    }

    // Set collectionDate to one month after creation by default, or use provided value
    let initialCollectionDate;
    if (collectionDate) {
      initialCollectionDate = new Date(collectionDate);
    } else {
      const now = new Date();
      initialCollectionDate = new Date(now.setMonth(now.getMonth() + 1));
    }

    // Create new donor
    const donor = await Donor.create({
      hundiNo,
      name,
      mobileNumber,
      address,
      googleMapLink,
      collectionDate: initialCollectionDate,
      group: groupId,
      createdBy: req.user.id
    });

    await donor.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'group', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Donor created successfully',
      data: { donor }
    });
  } catch (error) {
    console.error('Create donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating donor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all donors with pagination and filters
exports.getDonors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { hundiNo: { $regex: req.query.search, $options: 'i' } },
        { mobileNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.startDate && req.query.endDate) {
      filter.collectionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    if (req.query.group) {
      filter.group = req.query.group;
    }

    // Get total count for pagination
    const total = await Donor.countDocuments(filter);

    // Get donors with pagination
    const donors = await Donor.find(filter)
      .sort({ collectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'group', select: 'name description' }
      ]);

    res.json({
      success: true,
      data: {
        donors,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get donor by ID
exports.getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'group', select: 'name description' }
      ]);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.json({
      success: true,
      data: { donor }
    });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add status validation helper
const isValidStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;
  
  const validTransitions = {
    pending: ['collected', 'skipped'],
    collected: ['pending'],
    skipped: ['pending']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Update donor
exports.updateDonor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const donor = await Donor.findById(req.params.id);
    
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Check if hundi number is being changed and if it already exists
    if (req.body.hundiNo && req.body.hundiNo !== donor.hundiNo) {
      const existingDonor = await Donor.findOne({ hundiNo: req.body.hundiNo });
      if (existingDonor) {
        return res.status(400).json({
          success: false,
          message: 'A donor with this hundi number already exists'
        });
      }
    }

    // If group is being changed, verify it exists
    if (req.body.group) {
      const groupExists = await Group.findById(req.body.group);
      if (!groupExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group specified'
        });
      }
    }

    // Handle status changes
    if (req.body.status) {
      if (!isValidStatusTransition(donor.status, req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${donor.status} to ${req.body.status}`
        });
      }

      // Add to status history
      donor.statusHistory.push({
        status: req.body.status,
        date: new Date(),
        notes: req.body.notes || `Status changed to ${req.body.status}`
      });
    }

    // Update fields
    const updates = ['name', 'mobileNumber', 'address', 'googleMapLink', 'group', 'status', 'isActive'];
    updates.forEach(update => {
      if (req.body[update] !== undefined) {
        donor[update] = req.body[update];
      }
    });

    await donor.save();
    
    await donor.populate([
      { path: 'group', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: { donor }
    });
  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getDonorStatus = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('group', 'name area')
      .select('name hundiNo status collectionDate statusHistory')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Get last 5 donations
    const recentDonations = await Donation.find({ donor: donor._id })
      .sort('-collectionDate')
      .limit(5)
      .lean();

    const nextCollectionDate = donor.collectionDate ? 
      new Date(donor.collectionDate.getTime() + (30 * 24 * 60 * 60 * 1000)) : 
      null;

    res.json({
      success: true,
      data: {
        donor,
        nextCollectionDate,
        recentDonations,
        lastStatus: donor.statusHistory[donor.statusHistory.length - 1] || null
      }
    });
  } catch (error) {
    console.error('Get donor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donor status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete donor
exports.deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    await donor.deleteOne();

    res.json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    console.error('Delete donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting donor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update donor status
exports.updateDonorStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, notes } = req.body;
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(donor.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${donor.status} to ${status}`
      });
    }

    // Add to status history
    donor.statusHistory.push({
      status,
      date: new Date(),
      notes: notes || `Status changed to ${status}`
    });

    // Update status
    donor.status = status;

    // If status is collected, update next collection date
    if (status === 'collected') {
      const nextDate = new Date(donor.collectionDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      donor.collectionDate = nextDate;
    }

    await donor.save();

    await donor.populate([
      { path: 'group', select: 'name area' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: { donor }
    });
  } catch (error) {
    console.error('Update donor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donor status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Manual trigger for donor status updates (for testing)
exports.triggerStatusUpdate = async (req, res) => {
  try {
    const { updateDonorStatus } = require('../utils/cronJobs');
    const result = await updateDonorStatus();
    
    res.json({
      success: true,
      message: 'Donor status update completed',
      data: result
    });
  } catch (error) {
    console.error('Manual status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donor status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
