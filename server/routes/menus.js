/**
 * Menu Routes
 * 
 * This file defines all menu-related routes including food menu, room service menu,
 * and complaint menu management. Handles CRUD operations for all menu types
 * that guests can access through the QR code portal.
 */

const express = require('express');
const FoodItem = require('../models/FoodItem');
const RoomServiceItem = require('../models/RoomServiceItem');
const ComplaintItem = require('../models/ComplaintItem');
const { authenticateToken, verifyHotelAccess } = require('../middleware/auth');

const router = express.Router();

// ==================== FOOD MENU ROUTES ====================

// GET /api/hotels/:hotelId/food-menu - Get food menu
router.get('/:hotelId/food-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const foodItems = await FoodItem.find({ hotelId }).sort({ category: 1, name: 1 });
    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching food menu:', error);
    res.status(500).json({ message: 'Failed to fetch food menu' });
  }
});

// POST /api/hotels/:hotelId/food-menu - Create food item
router.post('/:hotelId/food-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const foodItem = new FoodItem({ ...req.body, hotelId });
    await foodItem.save();
    res.status(201).json(foodItem);
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({ message: 'Failed to create food item' });
  }
});

// PUT /api/hotels/:hotelId/food-menu/:itemId - Update food item
router.put('/:hotelId/food-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const foodItem = await FoodItem.findOneAndUpdate(
      { _id: itemId, hotelId },
      req.body,
      { new: true }
    );
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.json(foodItem);
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ message: 'Failed to update food item' });
  }
});

// DELETE /api/hotels/:hotelId/food-menu/:itemId - Delete food item
router.delete('/:hotelId/food-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const foodItem = await FoodItem.findOneAndDelete({ _id: itemId, hotelId });
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Failed to delete food item' });
  }
});

// ==================== ROOM SERVICE MENU ROUTES ====================

// GET /api/hotels/:hotelId/room-service-menu - Get room service menu
router.get('/:hotelId/room-service-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const serviceItems = await RoomServiceItem.find({ hotelId }).sort({ category: 1, name: 1 });
    res.json(serviceItems);
  } catch (error) {
    console.error('Error fetching room service menu:', error);
    res.status(500).json({ message: 'Failed to fetch room service menu' });
  }
});

// POST /api/hotels/:hotelId/room-service-menu - Create room service item
router.post('/:hotelId/room-service-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const serviceItem = new RoomServiceItem({ ...req.body, hotelId });
    await serviceItem.save();
    res.status(201).json(serviceItem);
  } catch (error) {
    console.error('Error creating room service item:', error);
    res.status(500).json({ message: 'Failed to create room service item' });
  }
});

// PUT /api/hotels/:hotelId/room-service-menu/:itemId - Update room service item
router.put('/:hotelId/room-service-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const serviceItem = await RoomServiceItem.findOneAndUpdate(
      { _id: itemId, hotelId },
      req.body,
      { new: true }
    );
    
    if (!serviceItem) {
      return res.status(404).json({ message: 'Room service item not found' });
    }
    
    res.json(serviceItem);
  } catch (error) {
    console.error('Error updating room service item:', error);
    res.status(500).json({ message: 'Failed to update room service item' });
  }
});

// DELETE /api/hotels/:hotelId/room-service-menu/:itemId - Delete room service item
router.delete('/:hotelId/room-service-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const serviceItem = await RoomServiceItem.findOneAndDelete({ _id: itemId, hotelId });
    
    if (!serviceItem) {
      return res.status(404).json({ message: 'Room service item not found' });
    }
    
    res.json({ message: 'Room service item deleted successfully' });
  } catch (error) {
    console.error('Error deleting room service item:', error);
    res.status(500).json({ message: 'Failed to delete room service item' });
  }
});

// ==================== COMPLAINT MENU ROUTES ====================

// GET /api/hotels/:hotelId/complaint-menu - Get complaint menu
router.get('/:hotelId/complaint-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const complaintItems = await ComplaintItem.find({ hotelId }).sort({ category: 1, name: 1 });
    res.json(complaintItems);
  } catch (error) {
    console.error('Error fetching complaint menu:', error);
    res.status(500).json({ message: 'Failed to fetch complaint menu' });
  }
});

// POST /api/hotels/:hotelId/complaint-menu - Create complaint item
router.post('/:hotelId/complaint-menu', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const complaintItem = new ComplaintItem({ ...req.body, hotelId });
    await complaintItem.save();
    res.status(201).json(complaintItem);
  } catch (error) {
    console.error('Error creating complaint item:', error);
    res.status(500).json({ message: 'Failed to create complaint item' });
  }
});

// PUT /api/hotels/:hotelId/complaint-menu/:itemId - Update complaint item
router.put('/:hotelId/complaint-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const complaintItem = await ComplaintItem.findOneAndUpdate(
      { _id: itemId, hotelId },
      req.body,
      { new: true }
    );
    
    if (!complaintItem) {
      return res.status(404).json({ message: 'Complaint item not found' });
    }
    
    res.json(complaintItem);
  } catch (error) {
    console.error('Error updating complaint item:', error);
    res.status(500).json({ message: 'Failed to update complaint item' });
  }
});

// DELETE /api/hotels/:hotelId/complaint-menu/:itemId - Delete complaint item
router.delete('/:hotelId/complaint-menu/:itemId', authenticateToken, verifyHotelAccess, async (req, res) => {
  try {
    const { hotelId, itemId } = req.params;
    const complaintItem = await ComplaintItem.findOneAndDelete({ _id: itemId, hotelId });
    
    if (!complaintItem) {
      return res.status(404).json({ message: 'Complaint item not found' });
    }
    
    res.json({ message: 'Complaint item deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint item:', error);
    res.status(500).json({ message: 'Failed to delete complaint item' });
  }
});

module.exports = router;