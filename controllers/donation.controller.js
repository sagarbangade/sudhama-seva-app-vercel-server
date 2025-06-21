const { validationResult } = require("express-validator");
const Donation = require("../models/donation.model");
const Donor = require("../models/donor.model");
const mongoose = require("mongoose");

// Create a new donation record
exports.createDonation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { donorId, amount, collectionDate, notes, collectionTime } = req.body;

    // Check if donor exists and is active
    const donor = await Donor.findById(donorId).session(session);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (!donor.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot create donation for inactive donor",
      });
    }

    // Create donation record
    const donation = await Donation.create(
      [
        {
          donor: donorId,
          amount,
          collectionDate,
          collectionTime,
          notes,
          collectedBy: req.user.id,
        },
      ],
      { session }
    );

    // Update donor status and set next collection date
    if (req.body.nextCollectionDate) {
      donor.collectionDate = new Date(req.body.nextCollectionDate);
    } else {
      donor.collectionDate = new Date(collectionDate);
      donor.collectionDate.setMonth(donor.collectionDate.getMonth() + 1);
    }
    donor.status = "collected";
    donor.statusHistory.push({
      status: "collected",
      date: collectionDate,
      notes: notes || "Collection completed",
    });

    await donor.save({ session });
    await session.commitTransaction();

    const populatedDonation = await Donation.findById(donation[0]._id).populate(
      [
        { path: "donor", select: "name hundiNo status collectionDate" },
        { path: "collectedBy", select: "name email" },
      ]
    );

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: { donation: populatedDonation },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create donation error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid donor ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating donation record",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
};

// Get all donations with filters
exports.getDonations = async (req, res) => {
  try {
    const {
      donorId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = "-collectionDate",
    } = req.query;

    const query = {};

    if (donorId) {
      query.donor = donorId;
    }

    if (startDate && endDate) {
      query.collectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate([
          { path: "donor", select: "name hundiNo status" },
          { path: "collectedBy", select: "name email" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching donations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Skip donation
exports.skipDonation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { donorId, notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notes are required when skipping collection",
      });
    }

    const donor = await Donor.findById(donorId).session(session);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (!donor.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot skip collection for inactive donor",
      });
    }

    // Update donor status to skipped and set next collection date to one month from now
    donor.status = "skipped";
    donor.collectionDate = new Date();
    donor.collectionDate.setMonth(donor.collectionDate.getMonth() + 1);
    donor.statusHistory.push({
      status: "skipped",
      date: new Date(),
      notes,
    });

    await donor.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Collection skipped successfully",
      data: { donor },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Skip donation error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid donor ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error skipping collection",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
};
