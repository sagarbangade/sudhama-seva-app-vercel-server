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
  updateDonorStatus,
  triggerStatusUpdate
} = require('../controllers/donor.controller');

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
 *     description: Create a new donor with basic information and assign to a group. The collection date will be set to one month from creation if not provided.
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDonorRequest'
 *           examples:
 *             valid:
 *               summary: Valid donor data
 *               value:
 *                 hundiNo: "H123456"
 *                 name: "Krishna Das"
 *                 mobileNumber: "9876543210"
 *                 address: "123 Bhakti Marg, Mayapur, West Bengal 741313"
 *                 googleMapLink: "https://goo.gl/maps/example"
 *                 group: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Donor created successfully
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
 *                   example: "Donor created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     donor:
 *                       $ref: '#/components/schemas/Donor'
 *             example:
 *               success: true
 *               message: "Donor created successfully"
 *               data:
 *                 donor:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   hundiNo: "H123456"
 *                   name: "Krishna Das"
 *                   mobileNumber: "9876543210"
 *                   address: "123 Bhakti Marg, Mayapur, West Bengal 741313"
 *                   googleMapLink: "https://goo.gl/maps/example"
 *                   group:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     name: "Mayapur Zone"
 *                     area: "ISKCON Mayapur Campus"
 *                   status: "pending"
 *                   collectionDate: "2024-02-15T00:00:00Z"
 *                   isActive: true
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or hundi number already exists
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
 *                     - field: "mobileNumber"
 *                       message: "Please enter a valid 10-digit mobile number"
 *                     - field: "name"
 *                       message: "Name must be at least 2 characters long"
 *               hundi_exists:
 *                 summary: Hundi number already exists
 *                 value:
 *                   success: false
 *                   message: "A donor with this hundi number already exists"
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
 *     summary: Get all donors with pagination, search, and filters
 *     description: Retrieve a paginated list of donors with optional search and filtering capabilities
 *     tags: [Donors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search donors by name, hundi number, or mobile number
 *         example: "Krishna"
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: Filter by group ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, skipped]
 *         description: Filter by donor status
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
 *           default: "-createdAt"
 *         description: Sort field (prefix with - for descending)
 *         example: "-createdAt"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     donors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Donor'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *             example:
 *               success: true
 *               data:
 *                 donors:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     hundiNo: "H123456"
 *                     name: "Krishna Das"
 *                     mobileNumber: "9876543210"
 *                     address: "123 Bhakti Marg, Mayapur"
 *                     googleMapLink: "https://goo.gl/maps/example"
 *                     group:
 *                       _id: "507f1f77bcf86cd799439012"
 *                       name: "Mayapur Zone"
 *                       area: "ISKCON Mayapur Campus"
 *                     status: "pending"
 *                     collectionDate: "2024-02-15T00:00:00Z"
 *                     isActive: true
 *                     createdBy:
 *                       _id: "507f1f77bcf86cd799439013"
 *                       name: "Admin User"
 *                       email: "admin@example.com"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                 pagination:
 *                   total: 50
 *                   page: 1
 *                   pages: 5
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
 * /api/donors/{id}:
 *   get:
 *     summary: Get donor by ID
 *     description: Retrieve detailed information about a specific donor
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
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Donor retrieved successfully
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
 *                     donor:
 *                       $ref: '#/components/schemas/Donor'
 *             example:
 *               success: true
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
 *                   status: "pending"
 *                   collectionDate: "2024-02-15T00:00:00Z"
 *                   statusHistory:
 *                     - status: "pending"
 *                       date: "2024-01-15T10:30:00Z"
 *                       notes: "Donor created"
 *                   isActive: true
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       404:
 *         description: Donor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Donor not found"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 *   put:
 *     summary: Update donor
 *     description: Update donor information. All fields are optional - only provided fields will be updated.
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
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDonorRequest'
 *           examples:
 *             update_status:
 *               summary: Update donor status
 *               value:
 *                 status: "collected"
 *             update_info:
 *               summary: Update donor information
 *               value:
 *                 name: "Krishna Das Updated"
 *                 mobileNumber: "9876543211"
 *                 address: "456 Bhakti Marg, Mayapur"
 *     responses:
 *       200:
 *         description: Donor updated successfully
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
 *                     donor:
 *                       $ref: '#/components/schemas/Donor'
 *       400:
 *         description: Validation error or hundi number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Donor not found
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
 *     summary: Delete donor
 *     description: Permanently delete a donor and all associated data
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
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Donor deleted successfully
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
 *                   example: "Donor deleted successfully"
 *       404:
 *         description: Donor not found
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

/**
 * @swagger
 * /api/donors/{id}/status:
 *   get:
 *     summary: Get donor status with recent donations
 *     description: Retrieve donor status information including recent donations and next collection date
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
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Donor status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DonorStatus'
 *             example:
 *               success: true
 *               data:
 *                 donor:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   name: "Krishna Das"
 *                   hundiNo: "H123456"
 *                   status: "pending"
 *                   collectionDate: "2024-02-15T00:00:00Z"
 *                   statusHistory:
 *                     - status: "pending"
 *                       date: "2024-01-15T10:30:00Z"
 *                       notes: "Donor created"
 *                 nextCollectionDate: "2024-03-15T00:00:00Z"
 *                 recentDonations:
 *                   - _id: "507f1f77bcf86cd799439014"
 *                     amount: 1000
 *                     collectionDate: "2024-01-15T10:30:00Z"
 *                     notes: "Monthly donation"
 *                 lastStatus:
 *                   status: "pending"
 *                   date: "2024-01-15T10:30:00Z"
 *                   notes: "Donor created"
 *       404:
 *         description: Donor not found
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
 *   put:
 *     summary: Update donor status
 *     description: Update donor status and add entry to status history
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
 *         example: "507f1f77bcf86cd799439011"
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
 *                 example: "collected"
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *                 example: "Collection completed successfully"
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Donor status updated successfully
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
 *                     donor:
 *                       $ref: '#/components/schemas/Donor'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid status transition from collected to pending"
 *       404:
 *         description: Donor not found
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
  query('status').optional().isIn(['pending', 'collected', 'skipped']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('isActive').optional().isBoolean()
], getDonors);

router.get('/:id', auth, getDonorById);
router.get('/:id/status', auth, getDonorStatus);
router.put('/:id/status', auth, statusValidation, updateDonorStatus);

// Manual trigger for status updates (for testing)
router.post('/trigger-status-update', auth, triggerStatusUpdate);

router.put('/:id', auth, [
  ...donorValidation.map(validation => validation.optional()),
  body('isActive').optional().isBoolean()
], updateDonor);

router.delete('/:id', auth, deleteDonor);

module.exports = router;
