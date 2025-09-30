/**
 * Guest Routes
 * 
 * This file defines all guest-related routes including guest check-in,
 * check-out, guest management, and billing operations. Handles the complete
 * guest lifecycle from arrival to departure with financial tracking.
 */

const express = require('express');
const { getGuests, createGuest, updateGuest, checkOutGuest } = require('../controllers/guestController');
const { authenticateToken, verifyHotelAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/hotels/:hotelId/guests - Get all guests for a hotel
router.get('/:hotelId/guests', authenticateToken, verifyHotelAccess, getGuests);

// POST /api/hotels/:hotelId/guests - Create new guest (check-in)
router.post('/:hotelId/guests', authenticateToken, verifyHotelAccess, createGuest);

// PUT /api/hotels/:hotelId/guests/:guestId - Update guest details
router.put('/:hotelId/guests/:guestId', authenticateToken, verifyHotelAccess, updateGuest);

// POST /api/hotels/:hotelId/guests/:guestId/checkout - Check out guest
router.post('/:hotelId/guests/:guestId/checkout', authenticateToken, verifyHotelAccess, checkOutGuest);

module.exports = router;