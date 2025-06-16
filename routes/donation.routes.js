const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const {
  createDonation,
  getDonations,
  getMonthlyStatus,
  updateDonation,
  deleteDonation
} = require('../controllers/donation.controller');
const { initializeMonthlyDonations } = require('../utils/cronJobs');

const router = express.Router();

// Validation middleware
const donationValidation = [
  body('donorId')
    .notEmpty()
    .withMessage('Donor ID is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value >= 0)
    .withMessage('Amount cannot be negative'),
  body('collectionDate')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .isIn(['pending', 'collected', 'skipped'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
];

// Routes
router.post('/', auth, donationValidation, createDonation);
router.get('/', auth, getDonations);
router.get('/monthly-status', auth, getMonthlyStatus);
router.put('/:id', auth, donationValidation, updateDonation);
router.delete('/:id', auth, deleteDonation);

// Manual initialization route (admin only)
router.post('/initialize-monthly', auth, async (req, res) => {
  try {
    await initializeMonthlyDonations();
    res.json({
      success: true,
      message: 'Monthly donations initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing monthly donations:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing monthly donations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;