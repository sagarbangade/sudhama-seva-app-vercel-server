const express = require("express");
const { body, query } = require("express-validator");
const { auth } = require("../middleware/auth.middleware");
const {
  createDonor,
  getDonors,
  getDonorById,
  updateDonor,
  deleteDonor,
  getDonorStatus,
  updateDonorStatus,
  triggerStatusUpdate,
} = require("../controllers/donor.controller");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Donor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique donor ID
 *           example: "507f1f77bcf86cd799439011"
 *         hundiNo:
 *           type: string
 *           description: Unique hundi number for the donor
 *           example: "H123456"
 *         name:
 *           type: string
 *           description: Donor's full name
 *           example: "Krishna Das"
 *           minLength: 2
 *         mobileNumber:
 *           type: string
 *           description: 10-digit mobile number
 *           example: "9876543210"
 *           pattern: "^[0-9]{10}$"
 *         address:
 *           type: string
 *           description: Donor's complete address
 *           example: "123 Bhakti Marg, Mayapur, West Bengal 741313"
 *         googleMapLink:
 *           type: string
 *           description: Google Maps link to donor's location
 *           example: "https://goo.gl/maps/example"
 *         group:
 *           type: object
 *           description: Group information
 *           properties:
 *             _id:
 *               type: string
 *               example: "507f1f77bcf86cd799439012"
 *             name:
 *               type: string
 *               example: "Mayapur Zone"
 *             area:
 *               type: string
 *               example: "ISKCON Mayapur Campus"
 *         status:
 *           type: string
 *           enum: [pending, collected, skipped]
 *           description: Current collection status
 *           example: "pending"
 *         collectionDate:
 *           type: string
 *           format: date-time
 *           description: Next collection date
 *           example: "2024-02-15T00:00:00Z"
 *         statusHistory:
 *           type: array
 *           description: History of status changes
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, collected, skipped]
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *         isActive:
 *           type: boolean
 *           description: Whether the donor is active
 *           example: true
 *         createdBy:
 *           type: object
 *           description: User who created the donor
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
 *           example: "2024-01-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *       required:
 *         - hundiNo
 *         - name
 *         - mobileNumber
 *         - address
 *         - group
 *
 *     CreateDonorRequest:
 *       type: object
 *       properties:
 *         hundiNo:
 *           type: string
 *           description: Unique hundi number
 *           example: "H123456"
 *         name:
 *           type: string
 *           description: Donor's full name
 *           example: "Krishna Das"
 *           minLength: 2
 *         mobileNumber:
 *           type: string
 *           description: 10-digit mobile number
 *           example: "9876543210"
 *           pattern: "^[0-9]{10}$"
 *         address:
 *           type: string
 *           description: Donor's complete address
 *           example: "123 Bhakti Marg, Mayapur, West Bengal 741313"
 *         googleMapLink:
 *           type: string
 *           description: Google Maps link to donor's location
 *           example: "https://goo.gl/maps/example"
 *         group:
 *           type: string
 *           description: Group ID the donor belongs to
 *           example: "507f1f77bcf86cd799439012"
 *         collectionDate:
 *           type: string
 *           format: date-time
 *           description: Initial collection date (optional, defaults to one month from creation)
 *           example: "2024-02-15T00:00:00Z"
 *       required:
 *         - hundiNo
 *         - name
 *         - mobileNumber
 *         - address
 *         - googleMapLink
 *
 *     UpdateDonorRequest:
 *       type: object
 *       properties:
 *         hundiNo:
 *           type: string
 *           description: Unique hundi number
 *           example: "H123456"
 *         name:
 *           type: string
 *           description: Donor's full name
 *           example: "Krishna Das"
 *           minLength: 2
 *         mobileNumber:
 *           type: string
 *           description: 10-digit mobile number
 *           example: "9876543210"
 *           pattern: "^[0-9]{10}$"
 *         address:
 *           type: string
 *           description: Donor's complete address
 *           example: "123 Bhakti Marg, Mayapur, West Bengal 741313"
 *         googleMapLink:
 *           type: string
 *           description: Google Maps link to donor's location
 *           example: "https://goo.gl/maps/example"
 *         group:
 *           type: string
 *           description: Group ID the donor belongs to
 *           example: "507f1f77bcf86cd799439012"
 *         status:
 *           type: string
 *           enum: [pending, collected, skipped]
 *           description: Current collection status
 *           example: "pending"
 *         isActive:
 *           type: boolean
 *           description: Whether the donor is active
 *           example: true
 *
 *     DonorStatus:
 *       type: object
 *       properties:
 *         donor:
 *           type: object
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
 *               example: "pending"
 *             collectionDate:
 *               type: string
 *               format: date-time
 *               example: "2024-02-15T00:00:00Z"
 *             statusHistory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [pending, collected, skipped]
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 *         nextCollectionDate:
 *           type: string
 *           format: date-time
 *           description: Calculated next collection date
 *           example: "2024-03-15T00:00:00Z"
 *         recentDonations:
 *           type: array
 *           description: Last 5 donations for this donor
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               amount:
 *                 type: number
 *               collectionDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *         lastStatus:
 *           type: object
 *           nullable: true
 *           description: Most recent status change
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, collected, skipped]
 *             date:
 *               type: string
 *               format: date-time
 *             notes:
 *               type: string
 */

/**
 * @swagger
 * /api/donors:
 *   post:
 *     summary: Create a new donor
 *     description: |
 *       Creates a new donor in the system. If no groups exist, it will automatically create default groups (A, B, C).
 *       If no group is specified in the request, the donor will be assigned to Group A by default.
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDonorRequest'
 *     responses:
 *       201:
 *         description: Donor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donor'
 *       400:
 *         description: Validation error or duplicate hundi number
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "A donor with this hundi number already exists"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: Server error or group initialization error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Failed to initialize default groups. Please create a group first."
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, hundi number, or mobile number
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: Filter by group ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, skipped]
 *         description: Filter by status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of donors retrieved successfully
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
 *                         donors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Donor'
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
 * /api/donors/{id}:
 *   get:
 *     summary: Get a donor by ID
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donor'
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
 *   put:
 *     summary: Update a donor
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDonorRequest'
 *     responses:
 *       200:
 *         description: Donor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donor'
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
 *       409:
 *         description: Hundi number already exists
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
 *   delete:
 *     summary: Delete a donor
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
 * /api/donors/{id}/status:
 *   get:
 *     summary: Get donor's status details
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DonorStatus'
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
 *   put:
 *     summary: Update donor's status
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, collected, skipped]
 *                 description: New status
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Donor status updated successfully
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
 * /api/donors/trigger-status-update:
 *   post:
 *     summary: Manually trigger donor status updates
 *     description: Manually trigger the cron job that updates donor statuses. This is useful for testing or immediate updates.
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status update completed successfully
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
 *                   example: "Donor status update completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       description: Number of donors updated
 *                       example: 5
 *                     totalChecked:
 *                       type: integer
 *                       description: Total number of donors checked
 *                       example: 50
 *             example:
 *               success: true
 *               message: "Donor status update completed"
 *               data:
 *                 updatedCount: 5
 *                 totalChecked: 50
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

// Validation middleware
const donorValidation = [
  body("hundiNo").notEmpty().withMessage("Hundi number is required").trim(),
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Please enter a valid 10-digit mobile number"),
  body("address").notEmpty().withMessage("Address is required").trim(),
  body("googleMapLink")
    .notEmpty()
    .withMessage("Google Map link is required")
    .trim(),
  body("group").optional().isMongoId().withMessage("Invalid group ID"),
];

// Update validation - makes googleMapLink required, others optional
const donorUpdateValidation = [
  body("hundiNo")
    .optional()
    .notEmpty()
    .withMessage("Hundi number cannot be empty")
    .trim(),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("mobileNumber")
    .optional()
    .notEmpty()
    .withMessage("Mobile number cannot be empty")
    .matches(/^[0-9]{10}$/)
    .withMessage("Please enter a valid 10-digit mobile number"),
  body("address")
    .optional()
    .notEmpty()
    .withMessage("Address cannot be empty")
    .trim(),
  body("googleMapLink")
    .notEmpty()
    .withMessage("Google Map link is required")
    .trim(),
  body("group").optional().isMongoId().withMessage("Invalid group ID"),
  body("isActive").optional().isBoolean(),
];

const statusValidation = [
  body("status")
    .isIn(["pending", "collected", "skipped"])
    .withMessage("Invalid status value"),
  body("notes").optional().trim(),
];

// Parameter validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !require("mongoose").Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid donor ID format",
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

// Routes
router.post("/", auth, donorValidation, handleValidationErrors, createDonor);

router.get(
  "/",
  auth,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search").optional().trim(),
    query("group")
      .optional()
      .isMongoId()
      .withMessage("Invalid group ID format"),
    query("status")
      .optional()
      .isIn(["pending", "collected", "skipped"])
      .withMessage("Invalid status value"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid start date format"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid end date format"),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false"),
  ],
  handleValidationErrors,
  getDonors
);

router.get("/:id", auth, validateObjectId, getDonorById);
router.get("/:id/status", auth, validateObjectId, getDonorStatus);
router.put(
  "/:id/status",
  auth,
  validateObjectId,
  statusValidation,
  handleValidationErrors,
  updateDonorStatus
);

// Manual trigger for status updates (for testing)
router.post("/trigger-status-update", triggerStatusUpdate);

router.put(
  "/:id",
  auth,
  validateObjectId,
  donorUpdateValidation,
  handleValidationErrors,
  updateDonor
);

router.delete("/:id", auth, validateObjectId, deleteDonor);

module.exports = router;
