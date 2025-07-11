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
const bodyParser = require('body-parser');
const crypto = require('crypto');

  const app = express();
  const server = http.createServer(app);
  app.use(bodyParser.json());
  app.use(express.static('public'));

  app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });

// Middleware
app.use(cors());
app.use(express.json());

//Adding RazorPay Payment Gateway
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
  uuid: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  guestPhone: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['call-service', 'order-food', 'room-service', 'complaint', 'custom-message'],
    required: true 
  },
  message: { type: String, required: true },
  orderDetails: {
    items: [{
      itemId: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      total: { type: Number }
    }],
    totalAmount: { type: Number, default: 0 }
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
}, { timestamps: true });

// Food Menu Schema
const foodItemSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  image: { type: String }, // URL to image
}, { timestamps: true });
const Hotel = mongoose.model('Hotel', hotelSchema);
const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Request = mongoose.model('Request', requestSchema);
const FoodItem = mongoose.model('FoodItem', foodItemSchema);

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
app.get('/', (req,res) => {
  res.send("Developer Sparsh -> https://sparshsingh.netlify.app/");
})

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

//Razorpay route
app.post('/api/subscribe', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;

    // Plan pricing logic
    const prices = {
      basic: 99900, // ₹999 in paise
      premium: 199900 // ₹1999 in paise
    };
    
    const amount = prices[plan];
    if (!amount) return res.status(400).json({ message: 'Invalid plan' });

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { plan },
    };

    const order = await razorpay.orders.create(options);
    res.json({ order });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// POST /api/payment/webhook
app.post('/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;

  const isValid = Razorpay.validateWebhookSignature(JSON.stringify(body), signature, secret);

  if (!isValid) return res.status(400).send('Invalid signature');

  const payment = body.payload.payment.entity;

  const userId = payment.notes.userId;
  const plan = payment.notes.plan;
  const duration = parseInt(payment.notes.duration);

  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

  // Update in DB
  await Hotel.updateOne({ admin: userId }, {
    subscription: {
      plan,
      status: 'active',
      expiresAt
    }
  });

  return res.status(200).json({ success: true });
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

    // Check for duplicate room
    const existingRoom = await Room.findOne({ hotelId, number });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Generate UUID
    const roomUuid = uuidv4();

    // Generate QR code with UUID
    const qrData = `${process.env.CLIENT_URL || 'http://localhost:5173'}/guest/${hotelId}/${roomUuid}`;
    const qrCode = await qrcode.toDataURL(qrData);

    // Create Room with UUID
    const room = new Room({
      hotelId,
      number,
      name,
      uuid: roomUuid,      // ✅ Save uuid
      qrCode               // ✅ Save QR image
    });

    await room.save();
    console.log("✅ Room created successfully");

    res.json(room);
  } catch (error) {
    console.error('❌ Room creation error:', error);
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
    const { roomId, type, message, priority, guestPhone, orderDetails } = req.body;
    const { hotelId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const request = new Request({
      hotelId,
      roomId: room._id,
      roomNumber: room.number,
      guestPhone: requestData.guestPhone,
      type: requestData.type,
      message: requestData.message,
      orderDetails: requestData.orderDetails,
      priority: requestData.priority || 'medium',
      status: 'pending'
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

// Guest Food Menu Route (no auth required)
app.get('/api/guest/:hotelId/food-menu', async (req, res) => {
  try {
    const { hotelId } = req.params;
    console.log('Fetching food menu for hotel:', hotelId);
    
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      console.log('Invalid hotelId:', hotelId);
      return res.status(400).json({ message: 'Invalid hotelId' });
    }
    
    const foodItems = await FoodItem.find({ 
      hotelId: new mongoose.Types.ObjectId(hotelId), 
      isAvailable: true 
    });
    
    console.log('Found food items:', foodItems.length);
    res.json(foodItems);
  } catch (error) {
    console.error('Guest food menu error:', error.stack || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Guest portal routes (no authentication required)
app.get('/api/guest/:hotelId/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    // Cast hotelId to ObjectId for query
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // FIX: Use 'new' with ObjectId
    const room = await Room.findOne({ hotelId: new mongoose.Types.ObjectId(hotelId), uuid: roomId });
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
    console.error('Error fetching guest portal data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/guest/:hotelId/:roomId/request', async (req, res) => {
  const { hotelId, roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: 'Invalid hotel ID' });
  }

  try {
    // ✅ Find the actual room using UUID
    console.log('Looking for room:', {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId
    });
    const room = await Room.findOne({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId
    });
    console.log('Room found:', room);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    
    const requestData = req.body;
   const request = new Request({
  hotelId,
  roomId: room._id,
  roomNumber: room.number,
  guestPhone: requestData.guestPhone,
  type: requestData.type,
  message: requestData.message,
  orderDetails: requestData.orderDetails,
  priority: requestData.priority || 'medium',
  status: 'pending'
});

    await request.save();

    res.status(201).json({ message: 'Request submitted successfully', request });
  } catch (err) {
    console.error('Guest request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Food Menu Routes
app.get('/api/hotels/:hotelId/food-menu', authenticateToken, async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ hotelId: req.params.hotelId });
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/hotels/:hotelId/food-menu', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;
    const { hotelId } = req.params;

    const foodItem = new FoodItem({
      hotelId,
      name,
      description,
      price,
      category,
      image,
    });

    await foodItem.save();
    res.json(foodItem);
  } catch (error) {
    console.error('Food item creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:hotelId/food-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const foodItem = await FoodItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    );
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/hotels/:hotelId/food-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const foodItem = await FoodItem.findByIdAndDelete(req.params.itemId);
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});