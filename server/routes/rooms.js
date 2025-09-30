/**
 * Room Routes
 * 
 * This file defines all room-related routes including room creation, updates,
 * QR code generation, and status management. Handles the hotel's room inventory
 * and availability management with proper authentication.
 */

const express = require('express');
const { getRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { authenticateToken, verifyHotelAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/hotels/:hotelId/rooms - Get all rooms for a hotel
router.get('/:hotelId/rooms', authenticateToken, verifyHotelAccess, getRooms);

// POST /api/hotels/:hotelId/rooms - Create new room
router.post('/:hotelId/rooms', authenticateToken, verifyHotelAccess, createRoom);

// PUT /api/hotels/:hotelId/rooms/:roomId - Update room
router.put('/:hotelId/rooms/:roomId', authenticateToken, verifyHotelAccess, updateRoom);

// DELETE /api/hotels/:hotelId/rooms/:roomId - Delete room
router.delete('/:hotelId/rooms/:roomId', authenticateToken, verifyHotelAccess, deleteRoom);

module.exports = router;