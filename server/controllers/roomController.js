/**
 * Room Controller
 * 
 * This file handles all room-related operations including room creation,
 * updates, QR code generation, and status management.
 * It manages the hotel's room inventory and availability.
 */

const QRCode = require('qrcode');
const Room = require('../models/Room');
const Guest = require('../models/Guest');

// Get all rooms for a hotel
const getRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const rooms = await Room.find({ hotelId }).populate('currentGuest').sort({ number: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

// Create new room
const createRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { number, name, type, ratePerNight, maxOccupancy, amenities } = req.body;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ hotelId, number });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Generate QR code
    const qrData = `${process.env.CLIENT_URL}/guest/${hotelId}/${number}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Create room
    const room = new Room({
      hotelId,
      number,
      name: name || `Room ${number}`,
      type: type || 'standard',
      ratePerNight: ratePerNight || 2000,
      maxOccupancy: maxOccupancy || 2,
      amenities: amenities || [],
      qrCode
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const updateData = req.body;

    // If room number is being changed, check for duplicates
    if (updateData.number) {
      const existingRoom = await Room.findOne({ 
        hotelId, 
        number: updateData.number,
        _id: { $ne: roomId }
      });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    const room = await Room.findOneAndUpdate(
      { _id: roomId, hotelId },
      updateData,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Failed to update room' });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    // Check if room is currently occupied
    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete occupied room' });
    }

    await Room.findOneAndDelete({ _id: roomId, hotelId });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Failed to delete room' });
  }
};

module.exports = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
};