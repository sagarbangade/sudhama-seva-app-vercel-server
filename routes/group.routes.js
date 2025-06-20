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
 *           examples:
 *             valid:
 *               summary: Valid group data
 *               value:
 *                 name: "Mayapur Zone"
 *                 area: "ISKCON Mayapur Campus"
 *                 description: "Devotees residing in Mayapur area including temple premises"
 *     responses:
 *       201:
 *         description: Group created successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *             example:
 *               success: true
 *               data:
 *                 group:
 *                   _id: "507f1f77bcf86cd799439012"
 *                   name: "Mayapur Zone"
 *                   area: "ISKCON Mayapur Campus"
 *                   description: "Devotees residing in Mayapur area including temple premises"
 *                   isActive: true
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or group name already exists
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
 *                     - field: "name"
 *                       message: "Name must be at least 2 characters long"
 *                     - field: "area"
 *                       message: "Area is required"
 *               name_exists:
 *                 summary: Group name already exists
 *                 value:
 *                   success: false
 *                   message: "A group with this name already exists"
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
 *     summary: Get all groups with pagination and search
 *     description: Retrieve a paginated list of groups with optional search and filtering capabilities
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search groups by name, area, or description
 *         example: "Mayapur"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive status
 *         example: true
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
 *           default: "name"
 *         description: Sort field (prefix with - for descending)
 *         example: "name"
 *     responses:
 *       200:
 *         description: List of groups retrieved successfully
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
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Group'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *             example:
 *               success: true
 *               data:
 *                 groups:
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     name: "Mayapur Zone"
 *                     area: "ISKCON Mayapur Campus"
 *                     description: "Devotees residing in Mayapur area including temple premises"
 *                     isActive: true
 *                     createdBy:
 *                       _id: "507f1f77bcf86cd799439013"
 *                       name: "Admin User"
 *                       email: "admin@example.com"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                   - _id: "507f1f77bcf86cd799439015"
 *                     name: "Kolkata Zone"
 *                     area: "Kolkata Metropolitan Area"
 *                     description: "Devotees in Kolkata and surrounding areas"
 *                     isActive: true
 *                     createdBy:
 *                       _id: "507f1f77bcf86cd799439013"
 *                       name: "Admin User"
 *                       email: "admin@example.com"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                 pagination:
 *                   total: 5
 *                   page: 1
 *                   pages: 1
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
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID with paginated donors
 *     description: Retrieve detailed information about a specific group including its donors
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
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search donors by name, hundi number, or mobile number
 *         example: "Krishna"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, skipped]
 *         description: Filter donors by status
 *         example: "pending"
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
 *           default: "name"
 *         description: Sort field for donors list
 *         example: "name"
 *     responses:
 *       200:
 *         description: Group retrieved successfully with paginated donors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GroupWithDonors'
 *             example:
 *               success: true
 *               data:
 *                 group:
 *                   _id: "507f1f77bcf86cd799439012"
 *                   name: "Mayapur Zone"
 *                   area: "ISKCON Mayapur Campus"
 *                   description: "Devotees residing in Mayapur area including temple premises"
 *                   isActive: true
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *                 donors:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     name: "Krishna Das"
 *                     hundiNo: "H123456"
 *                     collectionDate: "2024-02-15T00:00:00Z"
 *                   - _id: "507f1f77bcf86cd799439016"
 *                     name: "Radha Rani"
 *                     hundiNo: "H123457"
 *                     collectionDate: "2024-02-20T00:00:00Z"
 *                 pagination:
 *                   total: 15
 *                   page: 1
 *                   pages: 2
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Group not found"
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
 *   put:
 *     summary: Update group
 *     description: Update group information. All fields are optional - only provided fields will be updated.
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
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroupRequest'
 *           examples:
 *             update_info:
 *               summary: Update group information
 *               value:
 *                 name: "Mayapur Zone Updated"
 *                 area: "ISKCON Mayapur Campus and surrounding areas"
 *                 description: "Updated description for Mayapur zone"
 *             update_status:
 *               summary: Update group status
 *               value:
 *                 isActive: false
 *     responses:
 *       200:
 *         description: Group updated successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error or group name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     summary: Delete group
 *     description: Permanently delete a group. This will fail if there are any donors assigned to this group.
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
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Group deleted successfully
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
 *                   example: "Group deleted successfully"
 *       400:
 *         description: Cannot delete group with existing donors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Cannot delete group with existing donors. Please reassign donors first."
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
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

// Routes
router.post("/", auth, groupValidation, createGroup);

router.get(
  "/",
  auth,
  [
    query("search").optional().trim(),
    query("isActive").optional().isBoolean(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sort").optional().trim(),
  ],
  getGroups
);

router.get(
  "/:id",
  auth,
  validateObjectId,
  [
    query("search").optional().trim(),
    query("status").optional().isIn(["pending", "collected", "skipped"]),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sort").optional().trim(),
  ],
  getGroupById
);

router.put(
  "/:id",
  auth,
  validateObjectId,
  [
    ...groupValidation.map((validation) => validation.optional()),
    body("isActive").optional().isBoolean(),
  ],
  updateGroup
);

router.delete("/:id", auth, validateObjectId, deleteGroup);

module.exports = router;
