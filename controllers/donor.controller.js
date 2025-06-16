const { validationResult } = require('express-validator');
const Donor = require('../models/donor.model');

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
      date
    } = req.body;

    // Check if hundi number already exists
    const existingDonor = await Donor.findOne({ hundiNo });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: 'A donor with this hundi number already exists'
      });
    }

    // Create new donor
    const donor = await Donor.create({
      hundiNo,
      name,
      mobileNumber,
      address,
      googleMapLink,
      date: date || new Date(),
      createdBy: req.user.id
    });

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
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Get total count for pagination
    const total = await Donor.countDocuments(filter);

    // Get donors with pagination
    const donors = await Donor.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

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
      .populate('createdBy', 'name email');

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

// Update donor
exports.updateDonor = async (req, res) => {
  try {
    // Check for validation errors
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

    // Check if user is authorized to update
    if (donor.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donor'
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

    // Update donor
    const updatedDonor = await Donor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Donor updated successfully',
      data: { donor: updatedDonor }
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

    // Check if user is authorized to delete
    if (donor.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this donor'
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
