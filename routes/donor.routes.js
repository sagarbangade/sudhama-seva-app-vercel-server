const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const {
  createDonor,
  getDonors,
  getDonorById,
  updateDonor,
  deleteDonor
} = require('../controllers/donor.controller');

const router = express.Router();

// Validation middleware
const donorValidation = [
  body('hundiNo')
    .trim()
    .notEmpty()
    .withMessage('Hundi number is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('googleMapLink')
    .optional()
    .trim(),
  body('group')
    .notEmpty()
    .withMessage('Group is required')
    .isMongoId()
    .withMessage('Invalid group ID')
];

// Routes
router.post('/', auth, donorValidation, createDonor);
router.get('/', auth, getDonors);
router.get('/:id', auth, getDonorById);
router.put('/:id', auth, donorValidation, updateDonor);
router.delete('/:id', auth, deleteDonor);

module.exports = router;
