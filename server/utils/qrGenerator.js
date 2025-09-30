/**
 * QR Code Generator Utility
 * 
 * This file contains utility functions for generating QR codes for hotel rooms.
 * QR codes link to the guest portal with hotel and room information embedded.
 * Used when creating new rooms to generate unique QR codes.
 */

const QRCode = require('qrcode');

/**
 * Generate QR code for a hotel room
 * @param {string} hotelId - Hotel ID
 * @param {string} roomNumber - Room number
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
const generateRoomQRCode = async (hotelId, roomNumber) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrData = `${clientUrl}/guest/${hotelId}/${roomNumber}`;
    
    const qrCodeOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };

    const qrCode = await QRCode.toDataURL(qrData, qrCodeOptions);
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code with custom data
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
const generateCustomQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      ...options
    };

    const qrCode = await QRCode.toDataURL(data, defaultOptions);
    return qrCode;
  } catch (error) {
    console.error('Error generating custom QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateRoomQRCode,
  generateCustomQRCode
};