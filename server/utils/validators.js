/**
 * Input Validation Utilities
 * 
 * This file contains validation functions for user input sanitization and
 * validation. Ensures data integrity and security across all API endpoints.
 * Used to validate guest information, room data, and request parameters.
 */

const validator = require('validator');

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+91|91|0)?[6789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate guest data for check-in
 * @param {object} guestData - Guest information object
 * @returns {object} - Validation result with errors array
 */
const validateGuestData = (guestData) => {
  const errors = [];

  // Required fields validation
  if (!guestData.name || guestData.name.trim().length < 2) {
    errors.push('Guest name must be at least 2 characters');
  }

  if (!guestData.email || !isValidEmail(guestData.email)) {
    errors.push('Valid email address is required');
  }

  if (!guestData.phone || !isValidPhone(guestData.phone)) {
    errors.push('Valid phone number is required');
  }

  if (!guestData.idType || !guestData.idNumber) {
    errors.push('ID type and number are required');
  }

  if (!guestData.address || guestData.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }

  if (!guestData.checkInDate || !guestData.checkOutDate) {
    errors.push('Check-in and check-out dates are required');
  }

  if (guestData.checkInDate && guestData.checkOutDate) {
    const checkIn = new Date(guestData.checkInDate);
    const checkOut = new Date(guestData.checkOutDate);
    
    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
  }

  if (!guestData.adults || guestData.adults < 1) {
    errors.push('At least 1 adult is required');
  }

  if (!guestData.roomId) {
    errors.push('Room selection is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate room data
 * @param {object} roomData - Room information object
 * @returns {object} - Validation result with errors array
 */
const validateRoomData = (roomData) => {
  const errors = [];

  if (!roomData.number || roomData.number.trim().length === 0) {
    errors.push('Room number is required');
  }

  if (!roomData.name || roomData.name.trim().length < 2) {
    errors.push('Room name must be at least 2 characters');
  }

  if (roomData.ratePerNight && (roomData.ratePerNight < 0 || roomData.ratePerNight > 100000)) {
    errors.push('Rate per night must be between 0 and 100,000');
  }

  if (roomData.maxOccupancy && (roomData.maxOccupancy < 1 || roomData.maxOccupancy > 20)) {
    errors.push('Max occupancy must be between 1 and 20');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim());
};

/**
 * Validate and sanitize request data
 * @param {object} requestData - Request data object
 * @returns {object} - Sanitized and validated data
 */
const validateRequestData = (requestData) => {
  const errors = [];

  if (!requestData.type) {
    errors.push('Request type is required');
  }

  if (!requestData.guestPhone || !isValidPhone(requestData.guestPhone)) {
    errors.push('Valid guest phone number is required');
  }

  // Sanitize text fields
  const sanitized = {
    ...requestData,
    guestPhone: sanitizeString(requestData.guestPhone),
    message: sanitizeString(requestData.message || ''),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: sanitized
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validateGuestData,
  validateRoomData,
  sanitizeString,
  validateRequestData
};