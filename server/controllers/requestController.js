/**
 * Request Controller
 * 
 * This file handles all guest request operations including creating,
 * updating, and managing service requests from the guest portal.
 * It also handles real-time notifications via Socket.IO.
 */

const Request = require('../models/Request');
const Room = require('../models/Room');

// Get all requests for a hotel
const getRequests = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const requests = await Request.find({ hotelId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// Create new request
const createRequest = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const requestData = req.body;

    // Get room information
    const room = await Room.findById(requestData.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create request
    const request = new Request({
      ...requestData,
      hotelId,
      roomNumber: room.number
    });

    await request.save();

    // Emit real-time notification
    if (req.io) {
      req.io.to(`hotel_${hotelId}`).emit('newRequest', request);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Failed to create request' });
  }
};

// Update request status
const updateRequest = async (req, res) => {
  try {
    const { hotelId, requestId } = req.params;
    const updateData = req.body;

    const request = await Request.findOneAndUpdate(
      { _id: requestId, hotelId },
      updateData,
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(`hotel_${hotelId}`).emit('requestUpdated', request);
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Failed to update request' });
  }
};

module.exports = {
  getRequests,
  createRequest,
  updateRequest
};