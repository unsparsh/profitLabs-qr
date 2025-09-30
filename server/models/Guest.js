/**
 * Guest Model
 * 
 * This file defines the Guest schema for MongoDB using Mongoose.
 * Guests represent hotel visitors who check-in and check-out.
 * Each guest is linked to a hotel and room, with complete billing information.
 */

const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  idType: {
    type: String,
    required: true,
    enum: ['passport', 'driving-license', 'aadhar', 'voter-id', 'pan-card', 'other']
  },
  idNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0,
    min: 0
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  roomType: {
    type: String,
    required: true
  },
  ratePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  totalNights: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advancePayment: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  additionalCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  specialRequests: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in'
  }
}, {
  timestamps: true
});

// Index for efficient queries
guestSchema.index({ hotelId: 1, status: 1 });
guestSchema.index({ roomId: 1 });

module.exports = mongoose.model('Guest', guestSchema);