const { validationResult } = require("express-validator");
const Group = require("../models/group.model");
const Donor = require("../models/donor.model");
const mongoose = require("mongoose");
const {
  createErrorResponse,
  createSuccessResponse,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} = require("../utils/errorHandler");

// Initialize default groups
exports.initializeDefaultGroups = async (userId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const defaultGroups = [
      {
        name: "Group A",
        area: "Default Area A",
        description: "Default group for area A",
        createdBy: userId,
        isActive: true,
      },
      {
        name: "Group B",
        area: "Default Area B",
        description: "Default group for area B",
        createdBy: userId,
        isActive: true,
      },
      {
        name: "Group C",
        area: "Default Area C",
        description: "Default group for area C",
        createdBy: userId,
        isActive: true,
      },
    ];

    // Check if any default groups already exist
    const existingGroups = await Group.find({
      name: { $in: defaultGroups.map((g) => g.name) },
    }).session(session);

    if (existingGroups.length > 0) {
      return existingGroups;
    }

    // Create all default groups
    const createdGroups = await Group.insertMany(defaultGroups, { session });

    await session.commitTransaction();
    return createdGroups;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error initializing default groups:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, area, description } = req.body;

    // Check if group already exists
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "A group with this name already exists",
      });
    }

    const group = await Group.create({
      name,
      area,
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: { group },
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create group. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "name";

    // Build filter object
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { area: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Group.countDocuments(filter);

    // Get groups with pagination and sorting
    const groups = await Group.find(filter)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      message: "Groups retrieved successfully",
      data: {
        groups,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get group by ID with its donors
exports.getGroupById = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "name";

    const group = await Group.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Build donor filter
    const donorFilter = { group: req.params.id };
    if (req.query.search) {
      donorFilter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { hundiNo: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.status) {
      donorFilter.status = req.query.status;
    }
    if (req.query.startDate && req.query.endDate) {
      donorFilter.collectionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // Get total donors count for pagination
    const totalDonors = await Donor.countDocuments(donorFilter);

    // Get donors with pagination and sorting
    const donors = await Donor.find(donorFilter)
      .select("name hundiNo collectionDate") // removed status from select
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      message: "Group and donors retrieved successfully",
      data: {
        group,
        donors,
        pagination: {
          total: totalDonors,
          page,
          pages: Math.ceil(totalDonors / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get group error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch group. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if name is being changed and if it already exists
    if (req.body.name && req.body.name !== group.name) {
      const existingGroup = await Group.findOne({ name: req.body.name });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "A group with this name already exists",
        });
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Group updated successfully",
      data: { group: updatedGroup },
    });
  } catch (error) {
    console.error("Update group error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID format",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A group with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update group. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        message: "Group not found",
      });
    }

    // Check if group has any donors
    const donorCount = await Donor.countDocuments({ group: req.params.id });
    if (donorCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete group with existing donors. Please reassign donors first.",
      });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete group. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
