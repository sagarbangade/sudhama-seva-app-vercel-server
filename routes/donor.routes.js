const express = require('express');
const { body, query } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const {
  createDonor,
  getDonors,
  getDonorById,
  updateDonor,
  deleteDonor,
  getDonorStatus,
  updateDonorStatus
} = require('../controllers/donor.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Donor:
 *       type: object
 *       properties:
 *         hundiNo:
 *           type: string
 *           description: Unique hundi number
 *           example: "H123456"
 *         name:
 *           type: string
 *           description: Donor's name
 *           example: "Krishna Das"
 *         mobileNumber:
 *           type: string
 *           description: 10-digit mobile number
 *           example: "9876543210"
 *         address:
 *           type: string
 *           description: Donor's address
 *           example: "123 Bhakti Marg, Mayapur"
 *         googleMapLink:
 *           type: string
 *           description: Google Maps link to donor's location
 *           example: "https://goo.gl/maps/example"
 *         group:
 *           type: string
 *           format: uuid
 *           description: Group ID the donor belongs to
 *           example: "64789f234a12c789f234a12c"
 *         isActive:
 *           type: boolean
 *           default: true
 *           example: true
 *       required:
 *         - hundiNo
 *         - name
 *         - mobileNumber
 *         - address
 *         - group
 */

/**
 * @swagger
 * /api/donors:
 *   post:
 *     summary: Create a new donor
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Donor'
 *     responses:
 *       201:
 *         description: Donor created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 * 
 *   get:
 *     summary: Get all donors with pagination, search, and filters
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search donors by name, hundi number, or mobile number
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: Filter by group ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive status
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-date"
 *         description: Sort field (e.g., name, -date for descending)
 *     responses:
 *       200:
 *         description: List of donors retrieved successfully
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
 *                     donors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Donor'
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
 * /api/donors/{id}:
 *   get:
 *     summary: Get donor by ID
 *     tags: [Donors]
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
 *         description: Donor retrieved successfully
 *       404:
 *         description: Donor not found
 * 
 *   put:
 *     summary: Update donor
 *     tags: [Donors]
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
 *             $ref: '#/components/schemas/Donor'
 *     responses:
 *       200:
 *         description: Donor updated successfully
 *       404:
 *         description: Donor not found
 * 
 *   delete:
 *     summary: Delete donor
 *     tags: [Donors]
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
 *         description: Donor deleted successfully
 *       404:
 *         description: Donor not found
 */

const router = express.Router();

// Validation middleware
const donorValidation = [
  body('hundiNo')
    .notEmpty()
    .withMessage('Hundi number is required')
    .trim(),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim(),
  body('googleMapLink')
    .optional()
    .trim(),
  body('group')
    .optional()
    .isMongoId()
    .withMessage('Invalid group ID')
];

const statusValidation = [
  body('status')
    .isIn(['pending', 'collected', 'skipped'])
    .withMessage('Invalid status value'),
  body('notes')
    .optional()
    .trim()
];

// Routes
router.post('/', auth, donorValidation, createDonor);

router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('group').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], getDonors);

router.get('/:id', auth, getDonorById);
router.get('/:id/status', auth, getDonorStatus);
router.put('/:id/status', auth, statusValidation, updateDonorStatus);

router.put('/:id', auth, [
  ...donorValidation.map(validation => validation.optional()),
  body('isActive').optional().isBoolean()
], updateDonor);

router.delete('/:id', auth, deleteDonor);

module.exports = router;
