/**
 * Food Item Model
 * 
 * This file defines the FoodItem schema for MongoDB using Mongoose.
 * Food items represent the hotel's restaurant menu that guests can order
 * through the QR code portal. Each item has pricing and availability status.
 */

const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
foodItemSchema.index({ hotelId: 1, isAvailable: 1 });
foodItemSchema.index({ hotelId: 1, category: 1 });

module.exports = mongoose.model('FoodItem', foodItemSchema);