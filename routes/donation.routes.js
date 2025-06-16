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

module.exports = router;