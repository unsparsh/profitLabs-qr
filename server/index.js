const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/profitlabs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  totalRooms: { type: Number, required: true },
  subscription: {
    plan: { type: String, enum: ['trial', 'basic', 'premium'], default: 'trial' },
    status: { type: String, enum: ['active', 'inactive', 'canceled'], default: 'active' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  settings: {
    servicesEnabled: {
      callServiceBoy: { type: Boolean, default: true },
      orderFood: { type: Boolean, default: true },
      requestRoomService: { type: Boolean, default: true },
      lodgeComplaint: { type: Boolean, default: true },
      customMessage: { type: Boolean, default: true },
    },
    notifications: {
      sound: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
  },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
}, { timestamps: true });

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  number: { type: String, required: true },
  name: { type: String, required: true },
  qrCode: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['call-service', 'order-food', 'room-service', 'complaint', 'custom-message'],
    required: true 
  },
  message: { type: String, required: true },
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
}, { timestamps: true });

const Hotel = mongoose.model('Hotel', hotelSchema);
const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Request = mongoose.model('Request', requestSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinHotel', (hotelId) => {
    socket.join(hotelId);
    console.log(`User joined hotel room: ${hotelId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { hotelName, email, password, phone, address, totalRooms, adminName } = req.body;

    // Check if hotel already exists
    const existingHotel = await Hotel.findOne({ email });
    if (existingHotel) {
      return res.status(400).json({ message: 'Hotel already registered with this email' });
    }

    // Create hotel
    const hotel = new Hotel({
      name: hotelName,
      email,
      phone,
      address,
      totalRooms,
    });

    await hotel.save();

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name: adminName,
      role: 'admin',
      hotelId: hotel._id,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, hotelId: hotel._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        totalRooms: hotel.totalRooms,
        subscription: hotel.subscription,
        settings: hotel.settings,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Get hotel data
    const hotel = await Hotel.findById(user.hotelId);
    if (!hotel) {
      return res.status(400).json({ message: 'Hotel not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, hotelId: hotel._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        totalRooms: hotel.totalRooms,
        subscription: hotel.subscription,
        settings: hotel.settings,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Hotel routes
app.get('/api/hotels/:id', authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:id', authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Room routes
app.get('/api/hotels/:hotelId/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({ hotelId: req.params.hotelId });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/hotels/:hotelId/rooms', authenticateToken, async (req, res) => {
  try {
    const { number, name } = req.body;
    const { hotelId } = req.params;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ hotelId, number });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Generate QR code
    const qrData = `${process.env.CLIENT_URL || 'http://localhost:5173'}/guest/${hotelId}/${uuidv4()}`;
    const qrCode = await qrcode.toDataURL(qrData);

    const room = new Room({
      hotelId,
      number,
      name,
      qrCode,
    });

    await room.save();
    res.json(room);
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:hotelId/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      req.body,
      { new: true }
    );
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/hotels/:hotelId/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request routes
app.get('/api/hotels/:hotelId/requests', authenticateToken, async (req, res) => {
  try {
    const requests = await Request.find({ hotelId: req.params.hotelId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/hotels/:hotelId/requests', authenticateToken, async (req, res) => {
  try {
    const { roomId, type, message, priority } = req.body;
    const { hotelId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const request = new Request({
      hotelId,
      roomId,
      roomNumber: room.number,
      type,
      message,
      priority: priority || 'medium',
    });

    await request.save();

    // Emit real-time notification
    io.to(hotelId).emit('newRequest', request);

    res.json(request);
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:hotelId/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.requestId,
      req.body,
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Emit real-time update
    io.to(req.params.hotelId).emit('requestUpdated', request);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Guest portal routes (no authentication required)
app.get('/api/guest/:hotelId/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        settings: hotel.settings,
      },
      room: {
        _id: room._id,
        number: room.number,
        name: room.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/guest/:hotelId/:roomId/request', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { type, message, priority } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const request = new Request({
      hotelId,
      roomId,
      roomNumber: room.number,
      type,
      message,
      priority: priority || 'medium',
    });

    await request.save();

    // Emit real-time notification
    io.to(hotelId).emit('newRequest', request);

    res.json(request);
  } catch (error) {
    console.error('Guest request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});