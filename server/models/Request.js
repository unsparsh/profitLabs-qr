/**
 * Request Model
 * 
 * This file defines the Request schema for MongoDB using Mongoose.
 * Requests are service requests made by guests through the QR code portal.
 * They include food orders, room service, complaints, and custom messages.
 */

const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
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
  type: {
    type: String,
    required: true,
    enum: ['call-service', 'order-food', 'room-service', 'complaint', 'custom-message', 'security-alert']
  },
  message: {
    type: String,
    required: true
  },
  guestPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'canceled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // Food order details
  orderDetails: {
    items: [{
      name: String,
      quantity: Number,
      price: Number,
      total: Number
    }],
    totalAmount: Number
  },
  // Room service details
  serviceDetails: {
    serviceName: String,
    description: String,
    category: String,
    estimatedTime: String
  },
  // Complaint details
  complaintDetails: {
    complaintName: String,
    description: String,
    category: String,
    priority: String
  },
  // Custom message details
  customMessageDetails: {
    message: String
  },
  // Security alert details
  securityAlertDetails: {
    alertType: String,
    description: String,
    category: String,
    priority: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
requestSchema.index({ hotelId: 1, status: 1 });
requestSchema.index({ hotelId: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);