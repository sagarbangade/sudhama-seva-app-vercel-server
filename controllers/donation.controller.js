const { validationResult } = require("express-validator");
const { Donation } = require("../models/donation.model");
const { Donor } = require("../models/donor.model");
const mongoose = require("mongoose");
const {
  createErrorResponse,
  createSuccessResponse,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_CODES,
  ERROR_CODES,
} = require("../utils/errorHandler");

// Create a new donation record
exports.createDonation = async (req, res) => {
  let session;
  try {
    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw {
        status: STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: errors.array(),
      };
    }

    const { donorId, amount, collectionDate, collectionTime, notes } = req.body;

    // Find donor
    const donor = await Donor.findById(donorId).session(session);
    if (!donor) {
      throw {
        status: STATUS_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.DONOR_NOT_FOUND,
      };
    }

    if (!donor.isActive) {
      throw {
        status: STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.INACTIVE_DONOR,
      };
    }

    // Create donation
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

    // Update donor status and collection date
    const nextCollectionDate = new Date(collectionDate);
    nextCollectionDate.setMonth(nextCollectionDate.getMonth() + 1);

    await Donor.findByIdAndUpdate(
      donorId,
      {
        status: "collected",
        collectionDate: nextCollectionDate,
        $push: {
          statusHistory: {
            status: "collected",
            date: new Date(),
            notes: notes || "Monthly donation collected",
          },
        },
      },
      { session, new: true }
    );

    // Commit transaction
    await session.commitTransaction();

    const populatedDonation = await Donation.findById(donation[0]._id)
      .populate([
        { path: "donor", select: "name hundiNo status collectionDate" },
        { path: "collectedBy", select: "name email" },
      ])
      .session(session);

    res.status(STATUS_CODES.CREATED).json(
      createSuccessResponse(SUCCESS_MESSAGES.DONATION_CREATED, {
        donation: populatedDonation,
      })
    );
  } catch (error) {
    // Rollback transaction if it exists and is active
    if (session) {
      try {
        await session.abortTransaction();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    console.error("Create donation error:", error);

    // Handle known errors
    if (error.status) {
      return res
        .status(error.status)
        .json(createErrorResponse(error.status, error.message, error.errors));
    }

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json(
          createErrorResponse(
            STATUS_CODES.BAD_REQUEST,
            ERROR_MESSAGES.INVALID_ID,
            null,
            ERROR_CODES.VALIDATION_ERROR
          )
        );
    }

    // Handle validation errors from Mongoose
    if (error.name === "ValidationError") {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        createErrorResponse(
          STATUS_CODES.BAD_REQUEST,
          ERROR_MESSAGES.VALIDATION_FAILED,
          Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
          }))
        )
      );
    }

    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json(
        createErrorResponse(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.SERVER_ERROR,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  } finally {
    // Always end session
    if (session) {
      try {
        await session.endSession();
      } catch (error) {
        console.error("Error ending session:", error);
      }
    }
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
      message: "Donations retrieved successfully",
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
      message: "Failed to fetch donations. Please try again.",
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
      message: "Failed to skip collection. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
};
