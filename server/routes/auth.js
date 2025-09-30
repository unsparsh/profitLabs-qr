/**
 * Authentication Routes
 * 
 * This file defines all authentication-related routes including user registration,
 * login, and JWT token management. It handles the creation of new hotels and
 * admin users in the multi-tenant system.
 */

const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register - Register new hotel and admin user
router.post('/register', register);

// POST /api/auth/login - Login user and get JWT token
router.post('/login', login);

module.exports = router;