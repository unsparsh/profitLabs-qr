/**
 * Room Service Item Model
 * 
 * This file defines the RoomServiceItem schema for MongoDB using Mongoose.
 * Room service items represent housekeeping and maintenance services
 * that guests can request through the QR code portal.
 */

const mongoose = require('mongoose');

const roomServiceItemSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['housekeeping', 'maintenance', 'amenities', 'concierge', 'other']
  },
  estimatedTime: {
    type: String,
    required: true,
    default: '15 minutes'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomServiceItemSchema.index({ hotelId: 1, isAvailable: 1 });
roomServiceItemSchema.index({ hotelId: 1, category: 1 });

module.exports = mongoose.model('RoomServiceItem', roomServiceItemSchema);