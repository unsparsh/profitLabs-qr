/**
 * Hotel Routes
 * 
 * This file defines all hotel-related routes including hotel information
 * management, settings updates, and hotel-specific operations.
 * All routes require authentication and hotel ownership verification.
 */

const express = require('express');
const Hotel = require('../models/Hotel');
const { authenticateToken, verifyHotelAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/hotels/:id - Get hotel information
router.get('/:id', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Failed to fetch hotel' });
  }
});

// PUT /api/hotels/:id - Update hotel information
router.put('/:id', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    res.json(hotel);
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Failed to update hotel' });
  }
});

module.exports = router;