const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, restrictTo('admin'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with search and filters (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, business, admin]
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *   delete:
 *     summary: Delete user and related data (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /api/admin/businesses:
 *   get:
 *     summary: Get all businesses (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated business list
 */
router.get('/businesses', adminController.getBusinesses);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings with filters (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: business
 *         schema:
 *           type: string
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated booking list
 */
router.get('/bookings', adminController.getBookings);

module.exports = router;
