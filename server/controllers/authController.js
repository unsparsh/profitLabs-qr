/**
 * Authentication Controller
 * 
 * This file handles all authentication-related operations including
 * user registration, login, JWT token generation, and hotel creation.
 * It manages the multi-tenant authentication system.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');

// Generate JWT token
const generateToken = (userId, hotelId) => {
  return jwt.sign(
    { userId, hotelId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new hotel and admin user
const register = async (req, res) => {
  try {
    const { hotelName, email, password, phone, address, totalRooms, adminName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create hotel first
    const hotel = new Hotel({
      name: hotelName,
      email,
      phone,
      address,
      totalRooms
    });
    await hotel.save();

    // Create admin user
    const user = new User({
      email,
      password,
      name: adminName,
      role: 'admin',
      hotelId: hotel._id
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id, hotel._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId
      },
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        totalRooms: hotel.totalRooms,
        subscription: hotel.subscription,
        settings: hotel.settings
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Get hotel data
    const hotel = await Hotel.findById(user.hotelId);
    if (!hotel) {
      return res.status(400).json({ message: 'Hotel not found' });
    }

    // Generate token
    const token = generateToken(user._id, hotel._id);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId
      },
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        totalRooms: hotel.totalRooms,
        subscription: hotel.subscription,
        settings: hotel.settings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  register,
  login
};