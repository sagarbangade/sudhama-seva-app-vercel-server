const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  assignDonorsToGroup
} = require('../controllers/group.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the group
 *           example: "Mayapur Zone"
 *         description:
 *           type: string
 *           description: Description of the group
 *           example: "Devotees residing in Mayapur area"
 *         area:
 *           type: string
 *           description: Geographic area covered by the group
 *           example: "ISKCON Mayapur Campus"
 *         collectionDay:
 *           type: string
 *           enum: [sunday, monday, tuesday, wednesday, thursday, friday, saturday]
 *           description: Day of the week when collections are made
 *           example: "monday"
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the group is active
 *           example: true
 *       required:
 *         - name
 *         - area
 *         - collectionDay
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 * 
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: List of groups retrieved successfully
 */

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
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
 *         description: Group retrieved successfully
 *       404:
 *         description: Group not found
 * 
 *   put:
 *     summary: Update group
 *     tags: [Groups]
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
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 * 
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
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
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 */

const router = express.Router();

// Validation middleware
const groupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required'),
  body('area')
    .trim()
    .notEmpty()
    .withMessage('Area is required'),
  body('description')
    .optional()
    .trim()
];

// Add validation for donor assignment
const assignDonorsValidation = [
  body('donorIds')
    .isArray()
    .withMessage('Donor IDs must be an array')
    .notEmpty()
    .withMessage('At least one donor ID is required')
];

// Routes
router.post('/', auth, groupValidation, createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, getGroupById);
router.put('/:id', auth, groupValidation, updateGroup);
router.delete('/:id', auth, deleteGroup);
router.post('/:id/assign', auth, assignDonorsValidation, assignDonorsToGroup);

module.exports = router;