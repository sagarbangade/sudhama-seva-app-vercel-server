const { validationResult } = require('express-validator');
const Donation = require('../models/donation.model');
const Donor = require('../models/donor.model');
const mongoose = require('mongoose');

// Create a new donation record
exports.createDonation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { donorId, amount, collectionDate, status, notes, collectionTime } = req.body;

    // Check if donor exists and is active
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    if (!donor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create donation for inactive donor'
      });
    }

    // Validate collection time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(collectionTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection time format. Use HH:mm'
      });
    }

    // Format collection month (YYYY-MM)
    const date = new Date(collectionDate);
    const collectionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Check if donation already exists for this month
    const existingDonation = await Donation.findOne({
      donor: donorId,
      collectionMonth
    }).session(session);

    if (existingDonation) {
      return res.status(400).json({
        success: false,
        message: 'Donation record already exists for this month'
      });
    }

    // Validate amount for collected status
    if (status === 'collected' && (!amount || amount <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required for collected status'
      });
    }

    // Validate notes for skipped status
    if (status === 'skipped' && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required when skipping collection'
      });
    }

    const donation = await Donation.create([{
      donor: donorId,
      amount: status === 'collected' ? amount : 0,
      collectionDate,
      collectionTime,
      collectionMonth,
      status,
      notes,
      collectedBy: req.user.id
    }], { session });

    await session.commitTransaction();

    const populatedDonation = await Donation.findById(donation[0]._id)
      .populate([
        { path: 'donor', select: 'name hundiNo' },
        { path: 'collectedBy', select: 'name email' }
      ]);

    res.status(201).json({
      success: true,
      data: { donation: populatedDonation }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating donation record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      month,
      year,
      status,
      page = 1,
      limit = 10,
      sort = '-collectionDate'
    } = req.query;

    const query = {};
    
    if (donorId) {
      query.donor = donorId;
    }
    
    if (month && year) {
      query.collectionMonth = `${year}-${String(month).padStart(2, '0')}`;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .populate([
        { path: 'donor', select: 'name hundiNo' },
        { path: 'collectedBy', select: 'name email' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get monthly status
exports.getMonthlyStatus = async (req, res) => {
  try {
    const { year, month, search, page = 1, limit = 10 } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const collectionMonth = `${year}-${String(month).padStart(2, '0')}`;
    
    // Build donor filter
    const donorFilter = { isActive: true };
    if (search) {
      donorFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { hundiNo: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalDonors = await Donor.countDocuments(donorFilter);

    // Get paginated donors
    const skip = (page - 1) * limit;
    const donors = await Donor.find(donorFilter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get donations for these donors
    const donations = await Donation.find({
      collectionMonth,
      donor: { $in: donors.map(d => d._id) }
    }).populate('donor', 'name hundiNo');
    
    // Create status map
    const donationMap = new Map(donations.map(d => [d.donor._id.toString(), d]));
    
    // Create status report
    const statusReport = donors.map(donor => ({
      donor: {
        id: donor._id,
        name: donor.name,
        hundiNo: donor.hundiNo,
        mobileNumber: donor.mobileNumber
      },
      status: donationMap.has(donor._id.toString()) 
        ? donationMap.get(donor._id.toString()).status
        : 'pending',
      donation: donationMap.get(donor._id.toString()) || null
    }));

    // Get all donations for statistics (not affected by pagination)
    const allDonations = await Donation.find({ collectionMonth });
    const allActiveDonors = await Donor.countDocuments({ isActive: true });

    // Calculate statistics
    const stats = {
      total: allActiveDonors,
      collected: allDonations.filter(d => d.status === 'collected').length,
      pending: allActiveDonors - allDonations.length,
      skipped: allDonations.filter(d => d.status === 'skipped').length,
      totalAmount: allDonations.reduce((sum, d) => sum + (d.status === 'collected' ? d.amount : 0), 0)
    };

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        stats,
        statusReport,
        pagination: {
          total: totalDonors,
          page: parseInt(page),
          pages: Math.ceil(totalDonors / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get monthly status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update donation
exports.updateDonation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const donation = await Donation.findById(req.params.id).session(session);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation record not found'
      });
    }

    // Check if donor exists and is active
    const donor = await Donor.findById(donation.donor).session(session);
    if (!donor || !donor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Associated donor is not active or does not exist'
      });
    }

    // Validate status changes
    const { amount, status, notes } = req.body;
    if (status === 'collected' && (!amount || amount <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required for collected status'
      });
    }

    if (status === 'skipped' && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required when skipping collection'
      });
    }

    // Add validation for collection date change
    if (req.body.collectionDate) {
      const newDate = new Date(req.body.collectionDate);
      const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (newMonth !== donation.collectionMonth) {
        const existingDonation = await Donation.findOne({
          donor: donation.donor,
          collectionMonth: newMonth
        }).session(session);
        
        if (existingDonation) {
          return res.status(400).json({
            success: false,
            message: 'Donation record already exists for the new month'
          });
        }
        donation.collectionMonth = newMonth;
      }
    }

    // Update fields
    if (amount !== undefined) donation.amount = amount;
    if (status !== undefined) donation.status = status;
    if (notes !== undefined) donation.notes = notes;
    if (req.body.collectionDate) donation.collectionDate = req.body.collectionDate;
    if (req.body.collectionTime) donation.collectionTime = req.body.collectionTime;

    await donation.save({ session });
    await session.commitTransaction();

    await donation.populate([
      { path: 'donor', select: 'name hundiNo' },
      { path: 'collectedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: { donation }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// Delete donation
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation record not found'
      });
    }

    await donation.deleteOne();

    res.json({
      success: true,
      message: 'Donation record deleted successfully'
    });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting donation record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};