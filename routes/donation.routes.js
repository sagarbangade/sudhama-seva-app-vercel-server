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

/**
 * @swagger
 * components:
 *   schemas:
 *     Donation:
 *       type: object
 *       properties:
 *         donorId:
 *           type: string
 *           format: uuid
 *           description: ID of the donor
 *           example: "64789f234a12c789f234a12c"
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Donation amount
 *           example: 1008
 *         collectionDate:
 *           type: string
 *           format: date-time
 *           description: Date of collection
 *           example: "2025-06-18T10:30:00Z"
 *         collectionTime:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Time of collection (HH:mm)
 *           example: "10:30"
 *         status:
 *           type: string
 *           enum: [pending, collected, skipped]
 *           description: Status of the donation
 *           example: "collected"
 *         notes:
 *           type: string
 *           description: Notes about the donation (required when status is skipped)
 *           example: "Donor requested to skip this month"
 *       required:
 *         - donorId
 *         - collectionDate
 *         - collectionTime
 *         - status
 */

/**
 * @swagger
 * /api/donations:
 *   post:
 *     summary: Create a new donation record
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Donation'
 *     responses:
 *       201:
 *         description: Donation record created successfully
 *       400:
 *         description: Validation error
 * 
 *   get:
 *     summary: Get all donations with filters
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: donorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, skipped]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of donations retrieved successfully
 */

/**
 * @swagger
 * /api/donations/monthly-status:
 *   get:
 *     summary: Get monthly donation status with pagination and search
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search donors by name, hundi number, or mobile number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Monthly status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                     month:
 *                       type: integer
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         collected:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         skipped:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *                     statusReport:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           donor:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               hundiNo:
 *                                 type: string
 *                               mobileNumber:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, collected, skipped]
 *                           donation:
 *                             type: object
 *                             nullable: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */

/**
 * @swagger
 * /api/donations/{id}:
 *   put:
 *     summary: Update donation record
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Donation'
 *     responses:
 *       200:
 *         description: Donation updated successfully
 *       404:
 *         description: Donation not found
 * 
 *   delete:
 *     summary: Delete donation record
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Donation deleted successfully
 *       404:
 *         description: Donation not found
 */

/**
 * @swagger
 * /api/donations/initialize-monthly:
 *   post:
 *     summary: Initialize monthly donations manually
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly donations initialized successfully
 *       500:
 *         description: Error initializing monthly donations
 */

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