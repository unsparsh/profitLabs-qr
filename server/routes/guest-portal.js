/**
 * Guest Portal Routes
 * 
 * This file defines all public guest portal routes that don't require authentication.
 * These routes are accessed by guests through QR codes and include room information,
 * menu data, and request submission functionality.
 */

const express = require('express');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Request = require('../models/Request');
const FoodItem = require('../models/FoodItem');
const RoomServiceItem = require('../models/RoomServiceItem');
const ComplaintItem = require('../models/ComplaintItem');

const router = express.Router();

// GET /api/guest/:hotelId/:roomId - Get guest portal data
router.get('/:hotelId/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    // Find hotel and room
    const hotel = await Hotel.findById(hotelId);
    const room = await Room.findOne({ hotelId, number: roomId });

    if (!hotel || !room) {
      return res.status(404).json({ message: 'Hotel or room not found' });
    }

    res.json({
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        settings: hotel.settings
      },
      room: {
        _id: room._id,
        number: room.number,
        name: room.name
      }
    });
  } catch (error) {
    console.error('Error fetching guest portal data:', error);
    res.status(500).json({ message: 'Failed to load guest portal data' });
  }
});

// POST /api/guest/:hotelId/:roomId/request - Submit guest request
router.post('/:hotelId/:roomId/request', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const requestData = req.body;

    // Find room by number
    const room = await Room.findOne({ hotelId, number: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create appropriate message based on request type
    let message = '';
    switch (requestData.type) {
      case 'order-food':
        message = `Food order from Room ${roomId}. Items: ${requestData.orderDetails?.items?.map(item => `${item.name} x${item.quantity}`).join(', ')}. Total: ₹${requestData.orderDetails?.total}`;
        break;
      case 'room-service':
        message = `Room service request: ${requestData.serviceDetails?.serviceName}. ${requestData.serviceDetails?.description}`;
        break;
      case 'complaint':
        message = `Complaint: ${requestData.complaintDetails?.complaintName}. ${requestData.complaintDetails?.description}`;
        break;
      case 'custom-message':
        message = requestData.customMessageDetails?.message || 'Custom message from guest';
        break;
      case 'call-service-boy':
        message = 'Guest has requested immediate assistance from service boy';
        break;
      case 'security-alert':
        message = `Security Alert: ${requestData.securityAlertDetails?.description}`;
        break;
      default:
        message = 'Guest request';
    }

    // Create request
    const request = new Request({
      hotelId,
      roomId: room._id,
      roomNumber: room.number,
      type: requestData.type,
      message,
      guestPhone: requestData.guestPhone,
      priority: requestData.priority || 'medium',
      orderDetails: requestData.orderDetails,
      serviceDetails: requestData.serviceDetails,
      complaintDetails: requestData.complaintDetails,
      customMessageDetails: requestData.customMessageDetails,
      securityAlertDetails: requestData.securityAlertDetails
    });

    await request.save();

    // Emit real-time notification if socket is available
    if (req.io) {
      req.io.to(`hotel_${hotelId}`).emit('newRequest', request);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating guest request:', error);
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

// GET /api/guest/:hotelId/food-menu - Get food menu for guests
router.get('/:hotelId/food-menu', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const foodItems = await FoodItem.find({ hotelId, isAvailable: true });
    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching guest food menu:', error);
    res.status(500).json({ message: 'Failed to load food menu' });
  }
});

// GET /api/guest/:hotelId/room-service-menu - Get room service menu for guests
router.get('/:hotelId/room-service-menu', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const serviceItems = await RoomServiceItem.find({ hotelId, isAvailable: true });
    res.json(serviceItems);
  } catch (error) {
    console.error('Error fetching guest room service menu:', error);
    res.status(500).json({ message: 'Failed to load room service menu' });
  }
});

// GET /api/guest/:hotelId/complaint-menu - Get complaint options for guests
router.get('/:hotelId/complaint-menu', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const complaintItems = await ComplaintItem.find({ hotelId, isAvailable: true });
    res.json(complaintItems);
  } catch (error) {
    console.error('Error fetching guest complaint menu:', error);
    res.status(500).json({ message: 'Failed to load complaint options' });
  }
});

module.exports = router;