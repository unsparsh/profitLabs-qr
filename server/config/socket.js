/**
 * Socket.IO Configuration
 * 
 * This file configures Socket.IO for real-time communication between
 * the admin dashboard and guest portal. It handles room-based messaging,
 * authentication, and real-time notifications for hotel staff.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.hotelId = decoded.hotelId;
      } catch (err) {
        console.log('Socket auth failed:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join hotel-specific room for notifications
    socket.on('joinHotel', (hotelId) => {
      socket.join(`hotel_${hotelId}`);
      console.log(`👥 Socket ${socket.id} joined hotel_${hotelId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;