/**
 * Complaint Item Model
 * 
 * This file defines the ComplaintItem schema for MongoDB using Mongoose.
 * Complaint items represent different types of complaints that guests
 * can lodge through the QR code portal, with priority levels.
 */

const mongoose = require('mongoose');

const complaintItemSchema = new mongoose.Schema({
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
    enum: ['service', 'facility', 'cleanliness', 'noise', 'billing', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
complaintItemSchema.index({ hotelId: 1, isAvailable: 1 });
complaintItemSchema.index({ hotelId: 1, category: 1 });

module.exports = mongoose.model('ComplaintItem', complaintItemSchema);