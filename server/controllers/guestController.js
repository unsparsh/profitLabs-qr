/**
 * Guest Controller
 * 
 * This file handles all guest-related operations including check-in,
 * check-out, guest management, and billing calculations.
 * It manages the complete guest lifecycle in the hotel.
 */

const Guest = require('../models/Guest');
const Room = require('../models/Room');

// Get all guests for a hotel
const getGuests = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const guests = await Guest.find({ hotelId }).sort({ createdAt: -1 });
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ message: 'Failed to fetch guests' });
  }
};

// Create new guest (check-in)
const createGuest = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const guestData = req.body;

    // Calculate billing details
    const checkInDate = new Date(guestData.checkInDate);
    const checkOutDate = new Date(guestData.checkOutDate);
    const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = totalNights * guestData.ratePerNight;
    const pendingAmount = totalAmount - (guestData.advancePayment || 0);

    // Create guest record
    const guest = new Guest({
      ...guestData,
      hotelId,
      totalNights,
      totalAmount,
      paidAmount: guestData.advancePayment || 0,
      pendingAmount
    });

    await guest.save();

    // Update room status to occupied and link guest
    await Room.findByIdAndUpdate(guestData.roomId, {
      status: 'occupied',
      currentGuest: guest._id
    });

    res.status(201).json(guest);
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ message: 'Failed to create guest' });
  }
};

// Update guest details
const updateGuest = async (req, res) => {
  try {
    const { hotelId, guestId } = req.params;
    const updateData = req.body;

    const guest = await Guest.findOneAndUpdate(
      { _id: guestId, hotelId },
      updateData,
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(guest);
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ message: 'Failed to update guest' });
  }
};

// Check out guest
const checkOutGuest = async (req, res) => {
  try {
    const { hotelId, guestId } = req.params;
    const { additionalCharges = 0, finalPayment = 0 } = req.body;

    // Find guest
    const guest = await Guest.findOne({ _id: guestId, hotelId });
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Calculate final billing
    const finalTotalAmount = guest.totalAmount + additionalCharges;
    const finalPaidAmount = guest.paidAmount + finalPayment;
    const finalPendingAmount = Math.max(0, finalTotalAmount - finalPaidAmount);

    // Update guest record
    const updatedGuest = await Guest.findByIdAndUpdate(guestId, {
      status: 'checked-out',
      totalAmount: finalTotalAmount,
      paidAmount: finalPaidAmount,
      pendingAmount: finalPendingAmount,
      additionalCharges,
      checkOutDate: new Date()
    }, { new: true });

    // Update room status to available and remove guest link
    await Room.findByIdAndUpdate(guest.roomId, {
      status: 'available',
      currentGuest: null
    });

    res.json(updatedGuest);
  } catch (error) {
    console.error('Error checking out guest:', error);
    res.status(500).json({ message: 'Failed to check out guest' });
  }
};

module.exports = {
  getGuests,
  createGuest,
  updateGuest,
  checkOutGuest
};