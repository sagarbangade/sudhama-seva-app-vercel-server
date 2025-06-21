const express = require("express");
const { body, query } = require("express-validator");
const { auth } = require("../middleware/auth.middleware");
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} = require("../controllers/group.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique group ID
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           description: Name of the group
 *           example: "Mayapur Zone"
 *           minLength: 2
 *         area:
 *           type: string
 *           description: Geographic area covered by the group
 *           example: "ISKCON Mayapur Campus"
 *           minLength: 2
 *         description:
 *           type: string
 *           description: Detailed description of the group
 *           example: "Devotees residing in Mayapur area including temple premises"
 *         isActive:
 *           type: boolean
 *           description: Whether the group is active
 *           example: true
 *         createdBy:
 *           type: object
 *           description: User who created the group
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
 *         - name
 *         - area
 *
 *     CreateGroupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the group
 *           example: "Mayapur Zone"
 *           minLength: 2
 *         area:
 *           type: string
 *           description: Geographic area covered by the group
 *           example: "ISKCON Mayapur Campus"
 *           minLength: 2
 *         description:
 *           type: string
 *           description: Detailed description of the group
 *           example: "Devotees residing in Mayapur area including temple premises"
 *       required:
 *         - name
 *         - area
 *
 *     UpdateGroupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the group
 *           example: "Mayapur Zone"
 *           minLength: 2
 *         area:
 *           type: string
 *           description: Geographic area covered by the group
 *           example: "ISKCON Mayapur Campus"
 *           minLength: 2
 *         description:
 *           type: string
 *           description: Detailed description of the group
 *           example: "Devotees residing in Mayapur area including temple premises"
 *         isActive:
 *           type: boolean
 *           description: Whether the group is active
 *           example: true
 *
 *     GroupWithDonors:
 *       type: object
 *       properties:
 *         group:
 *           $ref: '#/components/schemas/Group'
 *         donors:
 *           type: array
 *           description: List of donors in this group
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               name:
 *                 type: string
 *                 example: "Krishna Das"
 *               hundiNo:
 *                 type: string
 *                 example: "H123456"
 *               collectionDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-15T00:00:00Z"
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     description: Create a new group to organize donors by geographical area
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Group'
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
 *       409:
 *         description: Group name already exists
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
 *     summary: Get all groups with pagination and filters
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name or area
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: List of groups retrieved successfully
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
 *                         groups:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Group'
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
 * /api/groups/{id}:
 *   get:
 *     summary: Get a group by ID with its donors
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for donors list
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of donors per page
 *     responses:
 *       200:
 *         description: Group and its donors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GroupWithDonors'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       404:
 *         description: Group not found
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
 *     summary: Update a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroupRequest'
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Group'
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
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Group name already exists
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
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
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
 *         description: Group not found
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

const router = express.Router();

// Validation middleware
const groupValidation = [
  body("name")
    .notEmpty()
    .withMessage("Group name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Group name must be at least 2 characters long"),
  body("area")
    .notEmpty()
    .withMessage("Area description is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Area description must be at least 2 characters long"),
  body("description").optional().trim(),
];

// Parameter validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !require("mongoose").Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid group ID format",
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
router.post("/", auth, groupValidation, handleValidationErrors, createGroup);

router.get(
  "/",
  auth,
  [
    query("search").optional().trim(),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false"),
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
  getGroups
);

router.get(
  "/:id",
  auth,
  validateObjectId,
  [
    query("search").optional().trim(),
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
  getGroupById
);

router.put(
  "/:id",
  auth,
  validateObjectId,
  [
    ...groupValidation.map((validation) => validation.optional()),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false"),
  ],
  handleValidationErrors,
  updateGroup
);

router.delete("/:id", auth, validateObjectId, deleteGroup);

module.exports = router;
