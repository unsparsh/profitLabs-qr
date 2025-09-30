/**
 * Request Routes
 * 
 * This file defines all guest request routes including service requests,
 * food orders, complaints, and custom messages. Handles both admin-side
 * request management and guest-side request submission.
 */

const express = require('express');
const { getRequests, createRequest, updateRequest } = require('../controllers/requestController');
const { authenticateToken, verifyHotelAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/hotels/:hotelId/requests - Get all requests for a hotel
router.get('/:hotelId/requests', authenticateToken, verifyHotelAccess, getRequests);

// POST /api/hotels/:hotelId/requests - Create new request (admin)
router.post('/:hotelId/requests', authenticateToken, verifyHotelAccess, createRequest);

// PUT /api/hotels/:hotelId/requests/:requestId - Update request status
router.put('/:hotelId/requests/:requestId', authenticateToken, verifyHotelAccess, updateRequest);

module.exports = router;