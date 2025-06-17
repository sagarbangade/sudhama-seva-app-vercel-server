const express = require('express');
const { body, query } = require('express-validator');
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
    .withMessage('Donor ID is required')
    .isMongoId()
    .withMessage('Invalid donor ID'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => {
      if (value < 0) throw new Error('Amount cannot be negative');
      return true;
    }),
  body('collectionDate')
    .notEmpty()
    .withMessage('Collection date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('collectionTime')
    .notEmpty()
    .withMessage('Collection time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:mm)'),
  body('status')
    .isIn(['pending', 'collected', 'skipped'])
    .withMessage('Invalid status')
    .custom((value, { req }) => {
      if (value === 'skipped' && !req.body.notes) {
        throw new Error('Notes are required when skipping collection');
      }
      if (value === 'collected' && (!req.body.amount || req.body.amount <= 0)) {
        throw new Error('Valid amount is required for collected status');
      }
      return true;
    }),
  body('notes')
    .optional()
    .trim()
];

// Add this validation
const monthlyStatusValidation = [
  query('year').isInt().withMessage('Valid year required'),
  query('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required')
];

// Routes
router.post('/', auth, donationValidation, createDonation);
router.get('/', auth, getDonations);
router.get('/monthly-status', auth, monthlyStatusValidation, getMonthlyStatus);
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