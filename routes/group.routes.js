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