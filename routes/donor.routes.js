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
 *     summary: Get all donors with pagination and filters
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of donors retrieved successfully
 *       401:
 *         description: Not authorized
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
