const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness
} = require('../controllers/businessController');
const { createBusinessValidator, updateBusinessValidator } = require('../validators/businessValidators');
const { idValidator } = require('../validators/idValidator');

/**
 * @swagger
 * /api/businesses:
 *   post:
 *     summary: Create a new business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               workingHours:
 *                 type: string
 *                 example: "09:00-17:00"
 *               slotDuration:
 *                 type: number
 *                 default: 30
 *     responses:
 *       201:
 *         description: Business created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *   get:
 *     summary: Get all businesses
 *     tags: [Business]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of businesses
 */
router.post('/', protect, createBusinessValidator, createBusiness);
router.get('/', getAllBusinesses);

/**
 * @swagger
 * /api/businesses/mine:
 *   get:
 *     summary: Get my businesses
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my businesses
 */
router.get('/mine', protect, require('../controllers/businessController').getMyBusinesses);
router.get('/my-business', protect, require('../controllers/businessController').getMyBusinesses);

/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Get business by ID
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *   patch:
 *     summary: Update business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       200:
 *         description: Business updated
 *   delete:
 *     summary: Delete business
 *     tags: [Business]
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
 *         description: Business deleted
 */
router.get('/:id', idValidator, getBusinessById);
router.patch('/:id', protect, idValidator, updateBusinessValidator, updateBusiness);
router.delete('/:id', protect, idValidator, deleteBusiness);

module.exports = router;
