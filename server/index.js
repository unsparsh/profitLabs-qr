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
const { google } = require('googleapis');
const OpenAI = require('openai');

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
app.options('*', cors());
app.use(express.json());

//Adding RazorPay Payment Gateway
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.CLIENT_URL}/auth/google/callback`
);
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

// Room Service Menu Schema
const roomServiceItemSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  estimatedTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

// Complaint Menu Schema
const complaintItemSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const Hotel = mongoose.model('Hotel', hotelSchema);
const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Request = mongoose.model('Request', requestSchema);
const FoodItem = mongoose.model('FoodItem', foodItemSchema);
const RoomServiceItem = mongoose.model('RoomServiceItem', roomServiceItemSchema);
const ComplaintItem = mongoose.model('ComplaintItem', complaintItemSchema);

// Google Auth Schema
const googleAuthSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  googleAccountId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  businessName: { type: String },
  businessId: { type: String },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

const GoogleAuth = mongoose.model('GoogleAuth', googleAuthSchema);

// Template Schema
const templateSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  tone: { type: String, enum: ['professional', 'friendly', 'apologetic'], required: true },
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);

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

// Google OAuth Routes
app.get('/api/google-auth/url/:hotelId', authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: hotelId, // Pass hotelId in state
      prompt: 'consent'
    });
    
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Google auth URL generation error:', error);
    res.status(500).json({ message: 'Failed to generate auth URL' });
  }
});

app.post('/api/google-auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    const hotelId = state;
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Get business info
    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });
    const businessAccounts = await mybusiness.accounts.list();
    
    const businessAccount = businessAccounts.data.accounts?.[0];
    
    // Save or update Google auth
    await GoogleAuth.findOneAndUpdate(
      { hotelId, googleAccountId: userInfo.data.id },
      {
        hotelId,
        googleAccountId: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        businessName: businessAccount?.name || 'Business',
        businessId: businessAccount?.name || '',
        expiresAt: new Date(tokens.expiry_date),
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

app.get('/api/google-auth/status/:hotelId', authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const googleAuth = await GoogleAuth.findOne({ hotelId });
    
    if (!googleAuth || googleAuth.expiresAt < new Date()) {
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      account: {
        name: googleAuth.name,
        email: googleAuth.email,
        picture: googleAuth.picture,
        businessName: googleAuth.businessName,
        businessId: googleAuth.businessId
      }
    });
  } catch (error) {
    console.error('Google auth status error:', error);
    res.status(500).json({ message: 'Failed to check auth status' });
  }
});

// Google Reviews Routes
app.get('/api/google-reviews/:hotelId', authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const googleAuth = await GoogleAuth.findOne({ hotelId });
    if (!googleAuth) {
      return res.status(401).json({ message: 'Google account not connected' });
    }
    
    // Set up OAuth client with stored tokens
    oauth2Client.setCredentials({
      access_token: googleAuth.accessToken,
      refresh_token: googleAuth.refreshToken
    });
    
    // Get reviews from Google My Business API
    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });
    
    try {
      // This is a simplified example - you'll need to implement proper location discovery
      const reviews = await mybusiness.accounts.locations.reviews.list({
        parent: `${googleAuth.businessId}/locations/-`
      });
      
      res.json({ reviews: reviews.data.reviews || [] });
    } catch (apiError) {
      console.error('Google My Business API error:', apiError);
      // Return mock data for development
      const mockReviews = [
        {
          reviewId: 'mock_review_1',
          reviewer: {
            displayName: 'John Smith',
            profilePhotoUrl: 'https://via.placeholder.com/40'
          },
          starRating: 'FIVE',
          comment: 'Amazing stay! The staff was incredibly helpful and the room was spotless. Will definitely come back!',
          createTime: '2024-01-15T10:00:00Z',
          updateTime: '2024-01-15T10:00:00Z'
        },
        {
          reviewId: 'mock_review_2',
          reviewer: {
            displayName: 'Sarah Johnson'
          },
          starRating: 'FOUR',
          comment: 'Great hotel with excellent service. The breakfast was delicious. Only minor issue was the WiFi speed.',
          createTime: '2024-01-14T15:30:00Z',
          updateTime: '2024-01-14T15:30:00Z'
        },
        {
          reviewId: 'mock_review_3',
          reviewer: {
            displayName: 'Mike Wilson'
          },
          starRating: 'TWO',
          comment: 'Room was not clean when we arrived. Had to wait 30 minutes for housekeeping. Not impressed.',
          createTime: '2024-01-13T20:15:00Z',
          updateTime: '2024-01-13T20:15:00Z',
          reviewReply: {
            comment: 'Thank you for your feedback. We sincerely apologize for the inconvenience...',
            updateTime: '2024-01-14T09:00:00Z'
          }
        }
      ];
      
      res.json({ reviews: mockReviews });
    }
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// AI Reply Generation with OpenAI GPT-4
app.post('/api/generate-reply', authenticateToken, async (req, res) => {
  try {
    const { reviewText, rating, customerName, tone = 'professional' } = req.body;
    
    // Construct prompt for GPT-4
    const toneInstructions = {
      professional: 'Write a professional and courteous reply',
      friendly: 'Write a warm and friendly reply',
      apologetic: 'Write an apologetic and understanding reply'
    };
    
    const prompt = `${toneInstructions[tone]} to this hotel review from ${customerName}:

Review (${rating}/5 stars): "${reviewText}"

Requirements:
- Keep it 2-3 sentences maximum
- Be genuine and personalized
- Include gratitude for the feedback
- ${rating >= 4 ? 'Express appreciation for positive feedback' : 'Address concerns professionally'}
- ${rating <= 2 ? 'Offer to make things right' : ''}
- Use hotel industry best practices
- Make it SEO-friendly with natural keywords
- End with an invitation to return or contact directly

Reply:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional hotel manager responding to guest reviews. Write concise, genuine, and helpful replies that maintain the hotel's reputation while addressing guest concerns appropriately."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    const aiReply = completion.choices[0].message.content.trim();
    
    res.json({ aiReply });
  } catch (error) {
    console.error('AI reply generation error:', error);
    res.status(500).json({ message: 'Failed to generate AI reply' });
  }
});

app.post('/api/send-reply/:hotelId', authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { reviewId, replyText } = req.body;
    
    const googleAuth = await GoogleAuth.findOne({ hotelId });
    if (!googleAuth) {
      return res.status(401).json({ message: 'Google account not connected' });
    }
    
    // Set up OAuth client
    oauth2Client.setCredentials({
      access_token: googleAuth.accessToken,
      refresh_token: googleAuth.refreshToken
    });
    
    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });
    
    try {
      // Send reply to Google My Business
      await mybusiness.accounts.locations.reviews.reply({
        name: `${googleAuth.businessId}/locations/-/reviews/${reviewId}`,
        requestBody: {
          comment: replyText
        }
      });
      
      res.json({ success: true, message: 'Reply sent to Google successfully' });
    } catch (apiError) {
      console.error('Google My Business reply error:', apiError);
      // Mock success for development
      res.json({ success: true, message: 'Reply sent to Google successfully (mock)' });
    }
  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({ message: 'Failed to send reply to Google' });
  }
});

// Template CRUD Routes
app.get('/api/templates/:hotelId', authenticateToken, async (req, res) => {
  try {
    const templates = await Template.find({ hotelId: req.params.hotelId });
    res.json(templates);
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

app.post('/api/templates/:hotelId', authenticateToken, async (req, res) => {
  try {
    const { name, content, tone } = req.body;
    const { hotelId } = req.params;
    
    const template = new Template({
      hotelId,
      name,
      content,
      tone
    });
    
    await template.save();
    res.json(template);
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
});

app.put('/api/templates/:hotelId/:templateId', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.templateId,
      req.body,
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

app.delete('/api/templates/:hotelId/:templateId', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

// WiFi Issue Fix - Format message properly
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
   
   // ✅ Process different request types and create proper message
   let message = '';
   let orderDetails = null;
   
   if (requestData.type === 'order-food' && requestData.orderDetails) {
     const order = requestData.orderDetails;
     message = `Food Order:\n${order.items.map(item => `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}\nTotal: ₹${order.total}`;
     orderDetails = {
       items: order.items.map(item => ({
         itemId: null,
         name: item.name,
         price: item.price,
         quantity: item.quantity,
         total: item.price * item.quantity
       })),
       totalAmount: order.total
     };
   } else if (requestData.type === 'room-service' && requestData.serviceDetails) {
     const service = requestData.serviceDetails;
     message = `Room Service Request: ${service.serviceName}\nCategory: ${service.category}\nEstimated Time: ${service.estimatedTime}\nDescription: ${service.description || 'N/A'}`;
   } else if (requestData.type === 'complaint' && requestData.complaintDetails) {
     const complaint = requestData.complaintDetails;
     message = `Issue: ${complaint.complaintName}\nCategory: ${complaint.category}\nPriority: ${complaint.priority}\nDescription: ${complaint.description || 'N/A'}`;
   } else if (requestData.type === 'custom-message' && requestData.customMessageDetails) {
     message = `Message: ${requestData.customMessageDetails.message}`;
   } else {
     message = requestData.message || 'No additional details provided';
   }

   const request = new Request({
  hotelId,
  roomId: room._id,
  roomNumber: room.number,
  guestPhone: requestData.guestPhone,
  type: requestData.type,
  message: message,
  orderDetails: orderDetails,
  priority: requestData.priority || 'medium',
  status: 'pending'
});

    await request.save();
    
    // ✅ Emit real-time notification to admin dashboard
    console.log('🔔 Emitting newRequest to hotel room:', hotelId);
    io.to(hotelId).emit('newRequest', request);

    res.status(201).json({ message: 'Request submitted successfully', request });
  } catch (error) {
    console.error('Guest request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
   
   // ✅ Process different request types and create proper message
   let message = '';
   let orderDetails = null;
   
   if (requestData.type === 'order-food' && requestData.orderDetails) {
     const order = requestData.orderDetails;
     message = `Food Order:\n${order.items.map(item => `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}\nTotal: ₹${order.total}`;
     orderDetails = {
       items: order.items.map(item => ({
         itemId: null,
         name: item.name,
         price: item.price,
         quantity: item.quantity,
         total: item.price * item.quantity
       })),
       totalAmount: order.total
     };
   } else if (requestData.type === 'room-service' && requestData.serviceDetails) {
     const service = requestData.serviceDetails;
     message = `Room Service Request: ${service.serviceName}\nCategory: ${service.category}\nEstimated Time: ${service.estimatedTime}\nDescription: ${service.description || 'N/A'}`;
   } else if (requestData.type === 'complaint' && requestData.complaintDetails) {
     const complaint = requestData.complaintDetails;
     message = `Complaint: ${complaint.complaintName}\nCategory: ${complaint.category}\nPriority: ${complaint.priority}\nDescription: ${complaint.description || 'N/A'}`;
   } else if (requestData.type === 'custom-message' && requestData.customMessageDetails) {
     message = requestData.customMessageDetails.message;
   } else {
     message = requestData.message || 'No additional details provided';
   }

   const request = new Request({
  hotelId,
  roomId: room._id,
  roomNumber: room.number,
  guestPhone: requestData.guestPhone,
  type: requestData.type,
  message: message,
  orderDetails: orderDetails,
  priority: requestData.priority || 'medium',
  status: 'pending'
});

    await request.save();
    
    // ✅ Emit real-time notification to admin dashboard
    console.log('🔔 Emitting newRequest to hotel room:', hotelId);
    io.to(hotelId).emit('newRequest', request);

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

// Room Service Menu Routes
app.get('/api/hotels/:hotelId/room-service-menu', authenticateToken, async (req, res) => {
  try {
    const roomServiceItems = await RoomServiceItem.find({ hotelId: req.params.hotelId });
    res.json(roomServiceItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/hotels/:hotelId/room-service-menu', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, estimatedTime } = req.body;
    const { hotelId } = req.params;

    const roomServiceItem = new RoomServiceItem({
      hotelId,
      name,
      description,
      category,
      estimatedTime,
    });

    await roomServiceItem.save();
    res.json(roomServiceItem);
  } catch (error) {
    console.error('Room service item creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:hotelId/room-service-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const roomServiceItem = await RoomServiceItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    );
    if (!roomServiceItem) {
      return res.status(404).json({ message: 'Room service item not found' });
    }
    res.json(roomServiceItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/hotels/:hotelId/room-service-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const roomServiceItem = await RoomServiceItem.findByIdAndDelete(req.params.itemId);
    if (!roomServiceItem) {
      return res.status(404).json({ message: 'Room service item not found' });
    }
    res.json({ message: 'Room service item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Complaint Menu Routes
app.get('/api/hotels/:hotelId/complaint-menu', authenticateToken, async (req, res) => {
  try {
    const complaintItems = await ComplaintItem.find({ hotelId: req.params.hotelId });
    res.json(complaintItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/hotels/:hotelId/complaint-menu', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, priority } = req.body;
    const { hotelId } = req.params;

    const complaintItem = new ComplaintItem({
      hotelId,
      name,
      description,
      category,
      priority,
    });

    await complaintItem.save();
    res.json(complaintItem);
  } catch (error) {
    console.error('Complaint item creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/hotels/:hotelId/complaint-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const complaintItem = await ComplaintItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    );
    if (!complaintItem) {
      return res.status(404).json({ message: 'Complaint item not found' });
    }
    res.json(complaintItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/hotels/:hotelId/complaint-menu/:itemId', authenticateToken, async (req, res) => {
  try {
    const complaintItem = await ComplaintItem.findByIdAndDelete(req.params.itemId);
    if (!complaintItem) {
      return res.status(404).json({ message: 'Complaint item not found' });
    }
    res.json({ message: 'Complaint item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});