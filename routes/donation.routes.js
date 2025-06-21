const express = require("express");
const { body, query } = require("express-validator");
const { auth } = require("../middleware/auth.middleware");
const {
  createDonation,
  getDonations,
  skipDonation,
} = require("../controllers/donation.controller");

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
 *     responses:
 *       201:
 *         description: Donation record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       404:
 *         description: Donor not found
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
 *     summary: Get all donations with pagination and filters
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: donorId
 *         schema:
 *           type: string
 *         description: Filter by donor ID
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
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of donations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         donations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Donation'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
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
 *     summary: Skip a donation for a donor
 *     description: Mark a donor's donation as skipped for the current collection period. This will update the donor's status to 'skipped' and set the next collection date.
 *     tags: [Donations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SkipDonationRequest'
 *     responses:
 *       200:
 *         description: Donation skipped successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DonorStatus'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       404:
 *         description: Donor not found
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
 *         description: Donation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Donation'
 *     responses:
 *       501:
 *         description: Not implemented
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: Donation ID
 *     responses:
 *       501:
 *         description: Not implemented
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

// Parameter validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !require("mongoose").Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid donation ID format",
    });
  }
  next();
};

// Add validation error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = require("express-validator").validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Validation middleware
const donationValidation = [
  body("donorId")
    .notEmpty()
    .withMessage("Donor ID is required")
    .isMongoId()
    .withMessage("Invalid donor ID"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("collectionDate")
    .notEmpty()
    .withMessage("Collection date is required")
    .isISO8601()
    .withMessage("Invalid date format"),
  body("collectionTime")
    .notEmpty()
    .withMessage("Collection time is required")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Please enter valid time in HH:mm format"),
  body("notes").optional().trim(),
];

const skipValidation = [
  body("donorId")
    .notEmpty()
    .withMessage("Donor ID is required")
    .isMongoId()
    .withMessage("Invalid donor ID"),
  body("notes")
    .notEmpty()
    .withMessage("Notes are required when skipping collection")
    .trim(),
];

// Routes
router.post(
  "/",
  auth,
  donationValidation,
  handleValidationErrors,
  createDonation
);
router.post(
  "/skip",
  auth,
  skipValidation,
  handleValidationErrors,
  skipDonation
);

router.get(
  "/",
  auth,
  [
    query("donorId")
      .optional()
      .isMongoId()
      .withMessage("Invalid donor ID format"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid start date format"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid end date format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("sort").optional().trim(),
  ],
  handleValidationErrors,
  getDonations
);

// Add routes for individual donation operations if needed
router.put("/:id", auth, validateObjectId, (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update donation functionality not implemented yet",
  });
});

router.delete("/:id", auth, validateObjectId, (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete donation functionality not implemented yet",
  });
});

module.exports = router;
