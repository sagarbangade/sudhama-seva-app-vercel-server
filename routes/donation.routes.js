const express = require('express');
const { body, query } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const {
  createDonation,
  getDonations,
  skipDonation
} = require('../controllers/donation.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Donation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique donation ID
 *           example: "507f1f77bcf86cd799439014"
 *         donor:
 *           type: object
 *           description: Donor information
 *           properties:
 *             _id:
 *               type: string
 *               example: "507f1f77bcf86cd799439011"
 *             name:
 *               type: string
 *               example: "Krishna Das"
 *             hundiNo:
 *               type: string
 *               example: "H123456"
 *             status:
 *               type: string
 *               enum: [pending, collected, skipped]
 *               example: "collected"
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Donation amount in rupees
 *           example: 1000
 *         collectionDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of collection
 *           example: "2024-01-15T10:30:00Z"
 *         collectionTime:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Time of collection in HH:mm format
 *           example: "10:30"
 *         notes:
 *           type: string
 *           description: Additional notes about the donation
 *           example: "Monthly donation collected"
 *         collectedBy:
 *           type: object
 *           description: User who collected the donation
 *           properties:
 *             _id:
 *               type: string
 *               example: "507f1f77bcf86cd799439013"
 *             name:
 *               type: string
 *               example: "Admin User"
 *             email:
 *               type: string
 *               example: "admin@example.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 * 
 *     CreateDonationRequest:
 *       type: object
 *       properties:
 *         donorId:
 *           type: string
 *           description: ID of the donor
 *           example: "507f1f77bcf86cd799439011"
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Donation amount in rupees
 *           example: 1000
 *         collectionDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of collection
 *           example: "2024-01-15T10:30:00Z"
 *         collectionTime:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Time of collection in HH:mm format
 *           example: "10:30"
 *         notes:
 *           type: string
 *           description: Additional notes about the donation
 *           example: "Monthly donation collected"
 *       required:
 *         - donorId
 *         - amount
 *         - collectionDate
 *         - collectionTime
 * 
 *     SkipDonationRequest:
 *       type: object
 *       properties:
 *         donorId:
 *           type: string
 *           description: ID of the donor
 *           example: "507f1f77bcf86cd799439011"
 *         notes:
 *           type: string
 *           description: Reason for skipping the donation
 *           example: "Donor requested to skip this month"
 *       required:
 *         - donorId
 *         - notes
 */

/**
 * @swagger
 * /api/donations:
 *   post:
 *     summary: Create a new donation record
 *     description: Record a new donation for a donor. This will automatically update the donor's status to 'collected' and set the next collection date to one month later.
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDonationRequest'
 *           examples:
 *             valid:
 *               summary: Valid donation data
 *               value:
 *                 donorId: "507f1f77bcf86cd799439011"
 *                 amount: 1000
 *                 collectionDate: "2024-01-15T10:30:00Z"
 *                 collectionTime: "10:30"
 *                 notes: "Monthly donation collected"
 *     responses:
 *       201:
 *         description: Donation record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     donation:
 *                       $ref: '#/components/schemas/Donation'
 *             example:
 *               success: true
 *               data:
 *                 donation:
 *                   _id: "507f1f77bcf86cd799439014"
 *                   donor:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     name: "Krishna Das"
 *                     hundiNo: "H123456"
 *                     status: "collected"
 *                   amount: 1000
 *                   collectionDate: "2024-01-15T10:30:00Z"
 *                   collectionTime: "10:30"
 *                   notes: "Monthly donation collected"
 *                   collectedBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "amount"
 *                       message: "Amount must be a positive number"
 *                     - field: "collectionTime"
 *                       message: "Please enter valid time in HH:mm format"
 *               donor_not_found:
 *                 summary: Donor not found
 *                 value:
 *                   success: false
 *                   message: "Donor not found"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 *   get:
 *     summary: Get all donations with filters
 *     description: Retrieve a paginated list of donations with optional filtering by donor, date range, and other criteria
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: donorId
 *         schema:
 *           type: string
 *         description: Filter by donor ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by collection date start (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by collection date end (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-collectionDate"
 *         description: Sort field (prefix with - for descending)
 *         example: "-collectionDate"
 *     responses:
 *       200:
 *         description: List of donations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     donations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Donation'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *             example:
 *               success: true
 *               data:
 *                 donations:
 *                   - _id: "507f1f77bcf86cd799439014"
 *                     donor:
 *                       _id: "507f1f77bcf86cd799439011"
 *                       name: "Krishna Das"
 *                       hundiNo: "H123456"
 *                       status: "collected"
 *                     amount: 1000
 *                     collectionDate: "2024-01-15T10:30:00Z"
 *                     collectionTime: "10:30"
 *                     notes: "Monthly donation collected"
 *                     collectedBy:
 *                       _id: "507f1f77bcf86cd799439013"
 *                       name: "Admin User"
 *                       email: "admin@example.com"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                 pagination:
 *                   total: 25
 *                   page: 1
 *                   pages: 3
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/donations/skip:
 *   post:
 *     summary: Skip donation for a donor
 *     description: Mark a donation as skipped for a donor. This will update the donor's status to 'skipped' and set the next collection date to one month from the skip date.
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SkipDonationRequest'
 *           examples:
 *             valid:
 *               summary: Valid skip data
 *               value:
 *                 donorId: "507f1f77bcf86cd799439011"
 *                 notes: "Donor requested to skip this month"
 *     responses:
 *       200:
 *         description: Collection skipped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Collection skipped successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     donor:
 *                       $ref: '#/components/schemas/Donor'
 *             example:
 *               success: true
 *               message: "Collection skipped successfully"
 *               data:
 *                 donor:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   hundiNo: "H123456"
 *                   name: "Krishna Das"
 *                   mobileNumber: "9876543210"
 *                   address: "123 Bhakti Marg, Mayapur"
 *                   googleMapLink: "https://goo.gl/maps/example"
 *                   group:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     name: "Mayapur Zone"
 *                     area: "ISKCON Mayapur Campus"
 *                   status: "skipped"
 *                   collectionDate: "2024-02-15T00:00:00Z"
 *                   isActive: true
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or donor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Notes are required when skipping collection"
 *               donor_not_found:
 *                 summary: Donor not found
 *                 value:
 *                   success: false
 *                   message: "Donor not found"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('collectionDate')
    .notEmpty()
    .withMessage('Collection date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('collectionTime')
    .notEmpty()
    .withMessage('Collection time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please enter valid time in HH:mm format'),
  body('notes')
    .optional()
    .trim()
];

const skipValidation = [
  body('donorId')
    .notEmpty()
    .withMessage('Donor ID is required')
    .isMongoId()
    .withMessage('Invalid donor ID'),
  body('notes')
    .notEmpty()
    .withMessage('Notes are required when skipping collection')
    .trim()
];

// Routes
router.post('/', auth, donationValidation, createDonation);
router.post('/skip', auth, skipValidation, skipDonation);

router.get('/', auth, [
  query('donorId').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().trim()
], getDonations);

module.exports = router;