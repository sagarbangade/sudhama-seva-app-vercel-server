const { validationResult } = require('express-validator');
const Donation = require('../models/donation.model');
const Donor = require('../models/donor.model');

// Create a new donation record
exports.createDonation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { donorId, amount, collectionDate, status, notes } = req.body;

    // Format collection month (YYYY-MM)
    const date = new Date(collectionDate);
    const collectionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Check if donation already exists for this month
    const existingDonation = await Donation.findOne({
      donor: donorId,
      collectionMonth
    });

    if (existingDonation) {
      return res.status(400).json({
        success: false,
        message: 'Donation record already exists for this month'
      });
    }

    const donation = await Donation.create({
      donor: donorId,
      amount,
      collectionDate,
      collectionMonth,
      status,
      notes,
      collectedBy: req.user.id
    });

    await donation.populate([
      { path: 'donor', select: 'name hundiNo' },
      { path: 'collectedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: { donation }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating donation record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const collectionMonth = `${year}-${String(month).padStart(2, '0')}`;
    
    // Get all active donors
    const donors = await Donor.find({ isActive: true });
    
    // Get donations for the month
    const donations = await Donation.find({ collectionMonth })
      .populate('donor', 'name hundiNo');
    
    // Create status map
    const donationMap = new Map(donations.map(d => [d.donor._id.toString(), d]));
    
    // Create status report
    const statusReport = donors.map(donor => ({
      donor: {
        id: donor._id,
        name: donor.name,
        hundiNo: donor.hundiNo
      },
      status: donationMap.has(donor._id.toString()) 
        ? donationMap.get(donor._id.toString()).status
        : 'pending',
      donation: donationMap.get(donor._id.toString()) || null
    }));

    // Calculate statistics
    const stats = {
      total: donors.length,
      collected: donations.filter(d => d.status === 'collected').length,
      pending: donors.length - donations.length,
      skipped: donations.filter(d => d.status === 'skipped').length,
      totalAmount: donations.reduce((sum, d) => sum + (d.status === 'collected' ? d.amount : 0), 0)
    };

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        stats,
        statusReport
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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation record not found'
      });
    }

    // Update allowed fields
    const { amount, status, notes } = req.body;
    if (amount !== undefined) donation.amount = amount;
    if (status !== undefined) donation.status = status;
    if (notes !== undefined) donation.notes = notes;

    await donation.save();
    await donation.populate([
      { path: 'donor', select: 'name hundiNo' },
      { path: 'collectedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: { donation }
    });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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