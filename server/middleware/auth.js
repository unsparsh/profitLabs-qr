/**
 * Authentication Middleware
 * 
 * This file contains middleware functions for JWT authentication and authorization.
 * It verifies JWT tokens, extracts user information, and protects routes that
 * require authentication. Used across all protected API endpoints.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and extract user info
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request object
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      hotelId: user.hotelId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Middleware to verify hotel ownership
const verifyHotelAccess = (req, res, next) => {
  const { hotelId } = req.params;
  
  if (req.user && req.user.hotelId.toString() === hotelId) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied to this hotel' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  verifyHotelAccess
};