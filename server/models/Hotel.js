/**
 * Hotel Model
 * 
 * This file defines the Hotel schema for MongoDB using Mongoose.
 * Hotels are the main tenant entities in the multi-tenant SaaS system.
 * Each hotel has its own rooms, guests, requests, and configuration settings.
 */

const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'premium'],
      default: 'trial'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  settings: {
    servicesEnabled: {
      callServiceBoy: { type: Boolean, default: true },
      orderFood: { type: Boolean, default: true },
      requestRoomService: { type: Boolean, default: true },
      lodgeComplaint: { type: Boolean, default: true },
      customMessage: { type: Boolean, default: true }
    },
    notifications: {
      sound: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    emergencyContact: {
      phone: { type: String, default: '+91 9876543210' },
      description: { type: String, default: 'Available 24/7 for any assistance' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hotel', hotelSchema);