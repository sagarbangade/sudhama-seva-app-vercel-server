const { validationResult } = require('express-validator');
const Group = require('../models/group.model');
const Donor = require('../models/donor.model');
const mongoose = require('mongoose');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, area, description } = req.body;

    // Check if group already exists
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'A group with this name already exists'
      });
    }

    const group = await Group.create({
      name,
      area,
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'name';
    
    // Build filter object
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { area: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Group.countDocuments(filter);

    // Get groups with pagination and sorting
    const groups = await Group.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get group by ID with its donors
exports.getGroupById = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'name';

    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Build donor filter
    const donorFilter = { group: req.params.id };
    if (req.query.search) {
      donorFilter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { hundiNo: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      donorFilter.status = req.query.status;
    }
    if (req.query.startDate && req.query.endDate) {
      donorFilter.collectionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Get total donors count for pagination
    const totalDonors = await Donor.countDocuments(donorFilter);

    // Get donors with pagination and sorting
    const donors = await Donor.find(donorFilter)
      .select('name hundiNo collectionDate') // removed status from select
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: { 
        group,
        donors,
        pagination: {
          total: totalDonors,
          page,
          pages: Math.ceil(totalDonors / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (req.body.name && req.body.name !== group.name) {
      const existingGroup = await Group.findOne({ name: req.body.name });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'A group with this name already exists'
        });
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: { group: updatedGroup }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if there are any donors in this group
    const donorCount = await Donor.countDocuments({ group: req.params.id });
    if (donorCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete group with existing donors. Please reassign donors first.'
      });
    }

    await group.deleteOne();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};