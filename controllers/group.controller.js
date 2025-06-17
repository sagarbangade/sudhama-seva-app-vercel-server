const { validationResult } = require('express-validator');
const Group = require('../models/group.model');
const Donor = require('../models/donor.model');

// Create initial groups
exports.initializeDefaultGroups = async (userId) => {
  const defaultGroups = ['Group A', 'Group B', 'Group C'];
  
  try {
    for (const groupName of defaultGroups) {
      const existingGroup = await Group.findOne({ name: groupName });
      if (!existingGroup) {
        await Group.create({
          name: groupName,
          description: `Default ${groupName}`,
          createdBy: userId
        });
      }
    }
    console.log('Default groups initialized successfully');
  } catch (error) {
    console.error('Error initializing default groups:', error);
  }
};

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

    const { name, description, area } = req.body; // Add area

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
      description,
      area, // Add this
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
    const groups = await Group.find()
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: { groups }
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
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get donors in this group
    const donors = await Donor.find({ group: req.params.id })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: { 
        group,
        donors
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

// Assign donors to group
exports.assignDonorsToGroup = async (req, res) => {
  try {
    const { donorIds } = req.body;
    const groupId = req.params.id;

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update all donors
    await Donor.updateMany(
      { _id: { $in: donorIds } },
      { $set: { group: groupId } }
    );

    res.json({
      success: true,
      message: 'Donors assigned to group successfully'
    });
  } catch (error) {
    console.error('Assign donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning donors to group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};