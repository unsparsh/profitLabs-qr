/**
 * Room Model
 * 
 * This file defines the Room schema for MongoDB using Mongoose.
 * Rooms belong to hotels and can be assigned to guests.
 * Each room has QR codes, status tracking, and pricing information.
 */

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  number: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'premium', 'executive'],
    default: 'standard'
  },
  ratePerNight: {
    type: Number,
    required: true,
    min: 0,
    default: 2000
  },
  maxOccupancy: {
    type: Number,
    required: true,
    min: 1,
    default: 2
  },
  amenities: [{
    type: String,
    enum: ['ac', 'wifi', 'tv', 'minibar', 'balcony', 'bathtub', 'room-service', 'laundry']
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'out-of-order'],
    default: 'available'
  },
  currentGuest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    default: null
  },
  qrCode: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
roomSchema.index({ hotelId: 1, status: 1 });
roomSchema.index({ hotelId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);