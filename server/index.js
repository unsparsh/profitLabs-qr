const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const qrcode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { google } = require("googleapis");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(express.static("public"));

const allowedOrigins = [
  "http://localhost:5173",
  "https://profitlabs-qr-frontend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());

//Adding RazorPay Payment Gateway
const Razorpay = require("razorpay");
const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/google/callback`
);
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Schemas
const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    totalRooms: { type: Number, required: true },
    subscription: {
      plan: {
        type: String,
        enum: ["trial", "basic", "premium"],
        default: "trial",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "canceled"],
        default: "active",
      },
      expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
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
      emergencyContact: {
        phone: { type: String, default: '+91 9876543210' },
        description: { type: String, default: 'Available 24/7 for any assistance' },
      },
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "admin" },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true }
);

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    number: { type: String, required: true },
    name: { type: String, required: true },
    uuid: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const requestSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    roomNumber: { type: String, required: true },
    guestPhone: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "call-service",
        "order-food",
        "room-service",
        "complaint",
        "custom-message",
        "wifi-support",
        "security-alert",
      ],
      required: true,
    },
    message: { type: String, required: true },
    orderDetails: {
      items: [
        {
          itemId: { type: mongoose.Schema.Types.ObjectId },
          name: { type: String },
          price: { type: Number },
          quantity: { type: Number },
          total: { type: Number },
        },
      ],
      totalAmount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "canceled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

// Food Menu Schema
const foodItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    image: { type: String }, // URL to image
  },
  { timestamps: true }
);

// Room Service Menu Schema
const roomServiceItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    estimatedTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Complaint Menu Schema
const complaintItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Hotel = mongoose.model("Hotel", hotelSchema);
const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const Request = mongoose.model("Request", requestSchema);
const FoodItem = mongoose.model("FoodItem", foodItemSchema);
const RoomServiceItem = mongoose.model(
  "RoomServiceItem",
  roomServiceItemSchema
);
const ComplaintItem = mongoose.model("ComplaintItem", complaintItemSchema);

// Google Auth Schema
const googleAuthSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    googleAccountId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    picture: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    businessName: { type: String },
    businessId: { type: String },
    expiresAt: { type: Date, required: true },
    businessLocationId: { type: String },
    reviewsCache: { type: Array },
    cacheTimestamp: { type: Date }
  },
  { timestamps: true }
);

const GoogleAuth = mongoose.model("GoogleAuth", googleAuthSchema);

// Template Schema
const templateSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true },
    content: { type: String, required: true },
    tone: {
      type: String,
      enum: ["professional", "friendly", "apologetic"],
      required: true,
    },
  },
  { timestamps: true }
);

const Template = mongoose.model("Template", templateSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "humari-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    }
  );
};

// Google OAuth Routes
app.get(
  "/api/google-auth/url/:hotelId",
  authenticateToken,
  async (req, res) => {
    try {
      const { hotelId } = req.params;

      const scopes = [
        "https://www.googleapis.com/auth/business.manage",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: hotelId, // Pass hotelId in state
        prompt: "consent",
      });

      res.json({ url: authUrl });
    } catch (error) {
      console.error("Google auth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  }
);

app.post("/api/google-auth/callback", async (req, res) => {
  try {
    const { code, state } = req.body;
    const hotelId = state;

    console.log("Google OAuth callback received:", {
      code: !!code,
      state,
      hotelId,
    });

    if (!code) {
      console.error("No authorization code received");
      return res
        .status(400)
        .json({ message: "No authorization code received" });
    }

    if (!hotelId) {
      console.error("No hotel ID in state parameter");
      return res.status(400).json({ message: "No hotel ID provided" });
    }

    // Check if Google OAuth is properly configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth credentials not configured");
      return res.status(500).json({
        message: "Google OAuth not configured on server",
        error:
          "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables",
      });
    }

    console.log("Google OAuth config check passed");

    // Exchange code for tokens
    let tokens;
    try {
      console.log("Attempting token exchange with Google...");
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      console.log("Tokens received successfully");
    } catch (tokenError) {
      console.error("Token exchange error:", tokenError.message);
      console.error("Token exchange full error:", tokenError);
      return res.status(400).json({
        message: "Failed to exchange authorization code for tokens",
        error: tokenError.message,
        details:
          process.env.NODE_ENV === "development" ? tokenError.stack : undefined,
      });
    }

    oauth2Client.setCredentials(tokens);

    // Get user info
    let userInfo;
    try {
      console.log("Fetching user info from Google...");
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfoResponse = await oauth2.userinfo.get();
      userInfo = userInfoResponse.data;
      console.log("User info retrieved:", userInfo.email);
    } catch (userInfoError) {
      console.error("User info retrieval error:", userInfoError.message);
      console.error("User info full error:", userInfoError);
      return res.status(400).json({
        message: "Failed to retrieve user information",
        error: userInfoError.message,
        details:
          process.env.NODE_ENV === "development"
            ? userInfoError.stack
            : undefined,
      });
    }

    // Get business info
    let businessAccount = null;
    try {
      console.log("Attempting to fetch business info...");
      const mybusinessAccounts = google.mybusinessaccountmanagement({
        version: "v1",
        auth: oauth2Client,
      });
      const businessAccounts = await mybusinessAccounts.accounts.list();
      businessAccount = businessAccounts.data.accounts?.[0];
      console.log(
        "Business account retrieved:",
        businessAccount?.name || "No business account"
      );
    } catch (businessError) {
      console.warn(
        "Business info retrieval warning (non-critical):",
        businessError.message
      );
      // This is not critical, continue without business info
    }

    // Save or update Google auth
    let googleAuth;
    try {
      console.log("Saving Google auth to database...");
      googleAuth = await GoogleAuth.findOneAndUpdate(
        { hotelId, googleAccountId: userInfo.id },
        {
          hotelId,
          googleAccountId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          businessName: businessAccount?.name || "Business",
          businessId: businessAccount?.name || "",
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000), // 1 hour default
        },
        { upsert: true, new: true }
      );
      console.log("Google auth saved successfully for hotel:", hotelId);
    } catch (dbError) {
      console.error("Database save error:", dbError.message);
      console.error("Database full error:", dbError);
      return res.status(500).json({
        message: "Failed to save authentication data",
        error: dbError.message,
        details:
          process.env.NODE_ENV === "development" ? dbError.stack : undefined,
      });
    }

    res.json({
      success: true,
      account: {
        name: googleAuth.name,
        email: googleAuth.email,
        picture: googleAuth.picture,
        businessName: googleAuth.businessName,
        businessId: googleAuth.businessId,
      },
    });
  } catch (error) {
    console.error("Google auth callback error:", error.message);
    console.error("Google auth callback full error:", error);
    res.status(500).json({
      message: "Authentication failed",
      error: error.message,
      details:
        process.env.NODE_ENV === "development"
          ? error.stack
          : "Internal server error",
    });
  }
});

app.get(
  "/api/google-auth/status/:hotelId",
  authenticateToken,
  async (req, res) => {
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
          businessId: googleAuth.businessId,
        },
      });
    } catch (error) {
      console.error("Google auth status error:", error);
      res.status(500).json({ message: "Failed to check auth status" });
    }
  }
);

// Google Reviews Routes
// app.get("/api/google-reviews/:hotelId", authenticateToken, async (req, res) => {
//   try {
//     const { hotelId } = req.params;
//     const googleAuth = await GoogleAuth.findOne({ hotelId });

//     if (!googleAuth) {
//       console.log("❌ No Google auth found for hotel:", hotelId);
//       return res.status(401).json({
//         message: "Google account not connected",
//         needsReconnect: true,
//       });
//     }

//     // --- Caching Logic ---
//     const CACHE_DURATION_HOURS = 24;
//     if (googleAuth.reviewsCache && googleAuth.cacheTimestamp) {
//       const cacheAge = (new Date() - new Date(googleAuth.cacheTimestamp)) / (1000 * 60 * 60);
//       if (cacheAge < CACHE_DURATION_HOURS) {
//         console.log("✅ Serving reviews from cache.");
//         return res.json({ reviews: googleAuth.reviewsCache });
//       }
//     }
//     console.log("🔍 Cache stale or empty. Fetching fresh data from Google...");

//     // --- Token Refresh Logic  ---
//     const bufferTime = 5 * 60 * 1000;
//     const isExpired = new Date(googleAuth.expiresAt).getTime() < (Date.now() + bufferTime);

//     if (isExpired && googleAuth.refreshToken) {
//         console.log("🔄 Token expired, attempting refresh...");
//         try {
//             const refreshClient = new google.auth.OAuth2(
//                 process.env.GOOGLE_CLIENT_ID,
//                 process.env.GOOGLE_CLIENT_SECRET
//             );
//             refreshClient.setCredentials({ refresh_token: googleAuth.refreshToken });
//             const { credentials } = await refreshClient.refreshAccessToken();

//             googleAuth.accessToken = credentials.access_token;
//             googleAuth.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
//             if(credentials.refresh_token) {
//                 googleAuth.refreshToken = credentials.refresh_token;
//             }
//             await googleAuth.save();
//             console.log("✅ Token refreshed and saved successfully");
//         } catch (refreshError) {
//             console.error("❌ Token refresh failed:", refreshError);
//             return res.status(401).json({
//                 message: "Google API authentication failed. Please reconnect your Google account.",
//                 needsReconnect: true,
//             });
//         }
//     } else if (isExpired) {
//         // Handle case where token is expired and there's no refresh token
//         return res.status(401).json({
//             message: "Session expired. Please reconnect your Google account.",
//             needsReconnect: true,
//         });
//     }

//     // --- API Fetching Logic ---
//     const authClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
//     authClient.setCredentials({ access_token: googleAuth.accessToken });

//     try {
//       let locationName = googleAuth.businessLocationId;
      
//       // ** Only fetch account/location if they are not cached **
//       if (!locationName) {
//         console.log("📋 Don't have a cached locationId. Fetching for the first time...");
        
//         // 1. Get Account
//         const mybusinessAccounts = google.mybusinessaccountmanagement({ version: "v1", auth: authClient });
//         const accountsResponse = await mybusinessAccounts.accounts.list();
//         if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
//           return res.json({ reviews: [], message: "No Google My Business accounts found." });
//         }
//         const accountName = accountsResponse.data.accounts[0].name;
//         console.log("✅ Found business account:", accountName);

//         // 2. Get Location
//         const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: authClient });
//         const locationsResponse = await businessInfo.accounts.locations.list({ parent: accountName });
//         if (!locationsResponse.data.locations || locationsResponse.data.locations.length === 0) {
//           return res.json({ reviews: [], message: "No business locations found." });
//         }
//         locationName = locationsResponse.data.locations[0].name;
//         console.log("✅ Found location:", locationName);

//         // 3. Save IDs to the database for future use
//         googleAuth.businessId = accountName; 
//         googleAuth.businessLocationId = locationName;
//         await googleAuth.save();
//         console.log("💾 Saved account and location IDs to the database.");
//       } else {
//         console.log("✅ Using cached location ID:", locationName);
//       }

//       // ** ALWAYS execute review fetch after getting a locationName **
//       console.log("⭐ Fetching reviews for location...");
//       const mybusinessReviews = google.mybusinessreviews({ version: 'v1', auth: authClient });
//       const reviewsResponse = await mybusinessReviews.accounts.locations.reviews.list({ parent: locationName });

//       const reviews = reviewsResponse.data.reviews || [];
//       console.log(`✅ Found ${reviews.length} reviews`);

//       // Transform reviews and update cache
//       const transformedReviews = reviews.map((review) => ({ /* your mapping logic */ }));
//       googleAuth.reviewsCache = transformedReviews;
//       googleAuth.cacheTimestamp = new Date();
//       await googleAuth.save();
//       console.log('💾 Successfully updated reviews cache.');
      
//       res.json({ reviews: transformedReviews });

//     } catch (apiError) {
//       console.error("❌ Google My Business API error:", apiError);
//       // Your existing detailed error handling for apiError is good.
//       res.status(apiError.code || 500).json({
//         message: "Failed to fetch reviews from Google My Business",
//         error: apiError.message,
//       });
//     }
//   } catch (error) {
//     console.error("❌ Top-level reviews fetch error:", error);
//     res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
//   }
// });

app.get("/api/google-reviews/:hotelId", authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const googleAuth = await GoogleAuth.findOne({ hotelId });

    if (!googleAuth) {
      return res.status(401).json({ message: "Google account not connected", needsReconnect: true });
    }

    // --- Caching Logic ---
    const CACHE_DURATION_HOURS = 24;
    if (googleAuth.reviewsCache && googleAuth.cacheTimestamp) {
      const cacheAge = (new Date() - new Date(googleAuth.cacheTimestamp)) / (1000 * 60 * 60);
      if (cacheAge < CACHE_DURATION_HOURS) {
        console.log("✅ Serving reviews from cache.");
        return res.json({ reviews: googleAuth.reviewsCache });
      }
    }
    console.log("🔍 Cache stale or empty. Fetching fresh data from Google...");

    // --- Token Refresh Logic ---
    const bufferTime = 5 * 60 * 1000;
    const isExpired = new Date(googleAuth.expiresAt).getTime() < (Date.now() + bufferTime);

    if (isExpired && googleAuth.refreshToken) {
      console.log("🔄 Token expired, attempting refresh...");
      try {
        const refreshClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        refreshClient.setCredentials({ refresh_token: googleAuth.refreshToken });
        const { credentials } = await refreshClient.refreshAccessToken();

        googleAuth.accessToken = credentials.access_token;
        googleAuth.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
        if (credentials.refresh_token) {
          googleAuth.refreshToken = credentials.refresh_token;
        }
        await googleAuth.save();
        console.log("✅ Token refreshed and saved successfully");
      } catch (refreshError) {
        return res.status(401).json({ message: "Google API authentication failed. Please reconnect your Google account.", needsReconnect: true });
      }
    }

    const authClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    authClient.setCredentials({ access_token: googleAuth.accessToken });

    // --- API Fetching Logic ---
    try {
      let locationName = googleAuth.businessLocationId;
      
      if (!locationName) {
        console.log("📋 First time setup: Fetching Account and Location IDs...");
        const mybusinessAccounts = google.mybusinessaccountmanagement({ version: "v1", auth: authClient });
        const accountsResponse = await mybusinessAccounts.accounts.list();
        if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
          return res.json({ reviews: [], message: "No Google My Business accounts found." });
        }
        const accountName = accountsResponse.data.accounts[0].name;

        const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: authClient });
        const locationsResponse = await businessInfo.accounts.locations.list({ parent: accountName });
        if (!locationsResponse.data.locations || locationsResponse.data.locations.length === 0) {
          return res.json({ reviews: [], message: "No business locations found." });
        }
        locationName = locationsResponse.data.locations[0].name;

        googleAuth.businessId = accountName; 
        googleAuth.businessLocationId = locationName;
        await googleAuth.save();
        console.log("💾 Saved account and location IDs to database for future use.");
      } else {
        console.log("✅ Using cached location ID:", locationName);
      }

      console.log("⭐ Fetching reviews...");
      const mybusinessReviews = google.mybusinessreviews({ version: 'v1', auth: authClient });
      const reviewsResponse = await mybusinessReviews.accounts.locations.reviews.list({ parent: locationName });

      const reviews = reviewsResponse.data.reviews || [];
      console.log(`✅ Found ${reviews.length} reviews`);

      const transformedReviews = reviews.map((review) => ({ /* your mapping logic */ }));
      googleAuth.reviewsCache = transformedReviews;
      googleAuth.cacheTimestamp = new Date();
      await googleAuth.save();
      console.log('💾 Successfully updated reviews cache.');
      
      res.json({ reviews: transformedReviews });

    } catch (apiError) {
      console.error("❌ Google My Business API error:", apiError.message);
      if (apiError.code === 429) {
        return res.status(429).json({ 
          error: 'Google API quota exceeded',
          message: "Google API quota exceeded. Please wait and try again later.",
          retryAfter: 300 // 5 minutes
        });
      }
      return res.status(apiError.code || 500).json({ 
        error: 'Google API error',
        message: "Failed to fetch reviews from Google My Business", 
        details: apiError.message 
      });
    }
  } catch (error) {
    console.error("❌ Top-level reviews fetch error:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});

app.post(
  "/api/google-auth/disconnect/:hotelId",
  authenticateToken,
  async (req, res) => {
    try {
      const { hotelId } = req.params;

      console.log("Disconnecting Google account for hotel:", hotelId);

      // Find and delete the Google auth record
      const googleAuth = await GoogleAuth.findOneAndDelete({ hotelId });

      if (!googleAuth) {
        console.log("No Google auth found to disconnect for hotel:", hotelId);
        return res
          .status(404)
          .json({ message: "No Google account connected for this hotel" });
      }

      console.log("Google auth disconnected successfully for hotel:", hotelId);

      res.json({
        success: true,
        message: "Google account disconnected successfully",
      });
    } catch (error) {
      console.error("Google disconnect error:", error);
      res.status(500).json({
        message: "Failed to disconnect Google account",
        error: error.message,
      });
    }
  }
);

// AI Reply Generation with OpenAI GPT-4
app.post("/api/generate-reply", authenticateToken, async (req, res) => {
  try {
    const {
      reviewText,
      rating,
      customerName,
      tone = "professional",
    } = req.body;

    // Check if OpenAI is available
    if (!openai) {
      // Use built-in AI templates as fallback
      const fallbackReply = generateFallbackReply(
        reviewText,
        rating,
        customerName,
        tone
      );
      return res.json({ aiReply: fallbackReply, source: "template" });
    }

    // Construct prompt for GPT-4
    const toneInstructions = {
      professional: "Write a professional and courteous reply",
      friendly: "Write a warm and friendly reply",
      apologetic: "Write an apologetic and understanding reply",
    };

    const prompt = `${
      toneInstructions[tone]
    } to this hotel review from ${customerName}:

Review (${rating}/5 stars): "${reviewText}"

Requirements:
- Keep it 2-3 sentences maximum
- Be genuine and personalized
- Include gratitude for the feedback
- ${
      rating >= 4
        ? "Express appreciation for positive feedback"
        : "Address concerns professionally"
    }
- ${rating <= 2 ? "Offer to make things right" : ""}
- Use hotel industry best practices
- Make it SEO-friendly with natural keywords
- End with an invitation to return or contact directly

Reply:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a professional hotel manager responding to guest reviews. Write concise, genuine, and helpful replies that maintain the hotel's reputation while addressing guest concerns appropriately.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0].message.content.trim();

    res.json({ aiReply, source: "openai" });
  } catch (error) {
    console.error("AI reply generation error:", error);
    // Fallback to template-based reply
    const fallbackReply = generateFallbackReply(
      req.body.reviewText,
      req.body.rating,
      req.body.customerName,
      req.body.tone
    );
    res.json({ aiReply: fallbackReply, source: "template_fallback" });
  }
});

// Fallback AI reply generation using templates
function generateFallbackReply(reviewText, rating, customerName, tone) {
  const templates = {
    professional: {
      positive: `Dear ${customerName}, thank you for your wonderful review! We're delighted to hear about your positive experience. We look forward to welcoming you back soon.`,
      neutral: `Dear ${customerName}, thank you for taking the time to share your feedback. We appreciate your comments and will use them to improve our services.`,
      negative: `Dear ${customerName}, thank you for your feedback. We sincerely apologize for not meeting your expectations. Please contact us directly so we can make this right.`,
    },
    friendly: {
      positive: `Hi ${customerName}! 🌟 We're so happy you enjoyed your stay with us! Your kind words made our day. Can't wait to see you again!`,
      neutral: `Hi ${customerName}! Thanks for sharing your thoughts with us. We really value your feedback and hope to serve you better next time!`,
      negative: `Hi ${customerName}, we're really sorry to hear about your experience. This isn't the standard we aim for. Let's chat and make things right!`,
    },
    apologetic: {
      positive: `Dear ${customerName}, we're truly grateful for your kind review. It means the world to us that you had a great experience. Thank you for choosing us!`,
      neutral: `Dear ${customerName}, we appreciate you taking the time to review us. Your feedback helps us grow and improve our services.`,
      negative: `Dear ${customerName}, we deeply apologize for the issues you experienced. This is not acceptable, and we want to make it right. Please contact us directly.`,
    },
  };

  const category = rating >= 4 ? "positive" : rating >= 3 ? "neutral" : "negative";
  return templates[tone]?.[category] || templates.professional[category];
}

// Rate limiting setup - Updated for better Google API quota management
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours (increased from 15 minutes)
const rateLimitMap = new Map();
const hotelRateLimitMap = new Map(); // Add per-hotel rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 5; // Reduced from 10 to be more conservative
const MAX_HOTEL_REQUESTS_PER_HOUR = 10; // Per-hotel limit
const reviewsCache = new Map();

const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || 'unknown';
  const hotelId = req.params.hotelId;
  const now = Date.now();
  
  // Check IP-based rate limiting
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (clientData.count >= MAX_REQUESTS_PER_MINUTE) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP. Please wait before trying again.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    } else {
      clientData.count++;
    }
  }
  
  // Check hotel-based rate limiting
  if (hotelId) {
    const hotelKey = `hotel_${hotelId}`;
    const hourWindow = 60 * 60 * 1000; // 1 hour
    
    if (!hotelRateLimitMap.has(hotelKey)) {
      hotelRateLimitMap.set(hotelKey, { count: 1, resetTime: now + hourWindow });
    } else {
      const hotelData = hotelRateLimitMap.get(hotelKey);
      
      if (now > hotelData.resetTime) {
        hotelRateLimitMap.set(hotelKey, { count: 1, resetTime: now + hourWindow });
      } else if (hotelData.count >= MAX_HOTEL_REQUESTS_PER_HOUR) {
        return res.status(429).json({
          error: 'Hotel rate limit exceeded',
          message: 'Too many Google API requests for this hotel. Please wait before trying again.',
          retryAfter: Math.ceil((hotelData.resetTime - now) / 1000)
        });
      } else {
        hotelData.count++;
      }
    }
  }
  
  next();
};


const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`🔄 API quota exceeded, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Request queue to prevent simultaneous API calls
const requestQueue = new Map();

const queueGoogleApiRequest = async (hotelId, apiCall) => {
  const queueKey = `google_api_${hotelId}`;
  
  if (requestQueue.has(queueKey)) {
    console.log('⏳ Waiting for existing Google API request to complete...');
    return await requestQueue.get(queueKey);
  }
  
  // Create new request promise
  const requestPromise = (async () => {
    try {
      return await retryWithBackoff(apiCall);
    } finally {
      requestQueue.delete(queueKey);
    }
  })();
  
  requestQueue.set(queueKey, requestPromise);
  return await requestPromise;
};

// Updated Google Reviews route with caching and rate limiting
app.get("/api/google-reviews/:hotelId", authenticateToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const googleAuth = await GoogleAuth.findOne({ hotelId });

    if (!googleAuth) {
      return res.status(401).json({ message: "Google account not connected", needsReconnect: true });
    }

    // Check cache first
    const cacheKey = `reviews_${hotelId}`;
    const cachedData = reviewsCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('✅ Returning cached reviews');
      return res.json({ 
        reviews: cachedData.reviews,
        cached: true,
        cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000)
      });
    }

    // --- Token Refresh Logic ---
    const bufferTime = 5 * 60 * 1000;
    const isExpired = new Date(googleAuth.expiresAt).getTime() < (Date.now() + bufferTime);

    if (isExpired && googleAuth.refreshToken) {
      console.log("🔄 Token expired, attempting refresh...");
      try {
        const refreshClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        refreshClient.setCredentials({ refresh_token: googleAuth.refreshToken });
        const { credentials } = await refreshClient.refreshAccessToken();

        googleAuth.accessToken = credentials.access_token;
        googleAuth.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
        if (credentials.refresh_token) {
          googleAuth.refreshToken = credentials.refresh_token;
        }
        await googleAuth.save();
        console.log("✅ Token refreshed and saved successfully");
      } catch (refreshError) {
        return res.status(401).json({ message: "Google API authentication failed. Please reconnect your Google account.", needsReconnect: true });
      }
    }

    const authClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    authClient.setCredentials({ access_token: googleAuth.accessToken });

    // --- API Fetching Logic ---
    try {
      let locationName = googleAuth.businessLocationId;
      
      if (!locationName) {
        console.log("📋 First time setup: Fetching Account and Location IDs...");
        const mybusinessAccounts = google.mybusinessaccountmanagement({ version: "v1", auth: authClient });
        const accountsResponse = await mybusinessAccounts.accounts.list();
        if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
          return res.json({ reviews: [], message: "No Google My Business accounts found." });
        }
        const accountName = accountsResponse.data.accounts[0].name;

        const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: authClient });
        const locationsResponse = await businessInfo.accounts.locations.list({ parent: accountName });
        if (!locationsResponse.data.locations || locationsResponse.data.locations.length === 0) {
          return res.json({ reviews: [], message: "No business locations found." });
        }
        locationName = locationsResponse.data.locations[0].name;

        googleAuth.businessId = accountName; 
        googleAuth.businessLocationId = locationName;
        await googleAuth.save();
        console.log("💾 Saved account and location IDs to database for future use.");
      } else {
        console.log("✅ Using cached location ID:", locationName);
      }

      console.log("⭐ Fetching reviews...");
      
      const apiCall = async () => {
        const mybusinessReviews = google.mybusinessreviews({ version: 'v1', auth: authClient });
        return await mybusinessReviews.accounts.locations.reviews.list({ parent: locationName });
      };
      
      const reviewsResponse = await queueGoogleApiRequest(hotelId, apiCall);
      
      const reviews = reviewsResponse.data.reviews || [];
      console.log(`✅ Found ${reviews.length} reviews`);

      const transformedReviews = reviews.map((review) => ({
        reviewId: review.name?.split('/').pop() || '',
        reviewer: {
          displayName: review.reviewer?.displayName || 'Anonymous',
          profilePhotoUrl: review.reviewer?.profilePhotoUrl || ''
        },
        starRating: review.starRating || 'THREE',
        comment: review.comment || '',
        createTime: review.createTime || new Date().toISOString(),
        updateTime: review.updateTime || new Date().toISOString(),
        reviewReply: review.reviewReply ? {
          comment: review.reviewReply.comment,
          updateTime: review.reviewReply.updateTime
        } : undefined
      }));

      // Update cache with longer duration
      reviewsCache.set(cacheKey, {
        reviews: transformedReviews,
        timestamp: Date.now()
      });
      
      console.log('💾 Successfully updated reviews cache with 2-hour duration.');
      
      res.json({ 
        reviews: transformedReviews,
        cached: false,
        cacheAge: 0
      });

    } catch (apiError) {
      console.error("❌ Google My Business API error:", apiError.message);
      if (apiError.code === 429) {
        return res.status(429).json({ 
          error: 'Google API quota exceeded',
          message: "Google API quota exceeded. Please wait and try again later.",
          retryAfter: 300 // 5 minutes
        });
      }
      return res.status(apiError.code || 500).json({ 
        error: 'Google API error',
        message: "Failed to fetch reviews from Google My Business", 
        details: apiError.message 
      });
    }
  } catch (error) {
    console.error("❌ Top-level reviews fetch error:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});

app.post("/api/send-reply/:hotelId", authenticateToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { reviewId, replyText } = req.body;

    const googleAuth = await GoogleAuth.findOne({ hotelId });
    if (!googleAuth) {
      return res.status(401).json({ message: "Google account not connected" });
    }

    // Set up OAuth client
    oauth2Client.setCredentials({
      access_token: googleAuth.accessToken,
      refresh_token: googleAuth.refreshToken,
    });

    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    try {
      const apiCall = async () => {
        return await mybusiness.accounts.locations.reviews.reply({
          name: `${googleAuth.businessId}/locations/-/reviews/${reviewId}`,
          requestBody: {
            comment: replyText,
          },
        });
      };

      await queueGoogleApiRequest(hotelId, apiCall);

      res.json({ success: true, message: "Reply sent to Google successfully" });
    } catch (apiError) {
      console.error("Google My Business reply error:", apiError);
      if (apiError.code === 429) {
        return res.status(429).json({ 
          error: 'Google API quota exceeded',
          message: "Google API quota exceeded. Please wait and try again later.",
          retryAfter: 300 // 5 minutes
        });
      }
      res.status(apiError.code || 500).json({ 
        success: false, 
        message: "Failed to send reply to Google",
        error: apiError.message 
      });
    }
  } catch (error) {
    console.error("Send reply error:", error);
    res.status(500).json({ message: "Failed to send reply to Google" });
  }
});


// Template CRUD Routes
app.get("/api/templates/:hotelId", authenticateToken, async (req, res) => {
  try {
    const templates = await Template.find({ hotelId: req.params.hotelId });
    res.json(templates);
  } catch (error) {
    console.error("Templates fetch error:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

app.post("/api/templates/:hotelId", authenticateToken, async (req, res) => {
  try {
    const { name, content, tone } = req.body;
    const { hotelId } = req.params;

    const template = new Template({
      hotelId,
      name,
      content,
      tone,
    });

    await template.save();
    res.json(template);
  } catch (error) {
    console.error("Template creation error:", error);
    res.status(500).json({ message: "Failed to create template" });
  }
});

app.put(
  "/api/templates/:hotelId/:templateId",
  authenticateToken,
  async (req, res) => {
    try {
      const template = await Template.findByIdAndUpdate(
        req.params.templateId,
        req.body,
        { new: true }
      );

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Template update error:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  }
);

app.delete(
  "/api/templates/:hotelId/:templateId",
  authenticateToken,
  async (req, res) => {
    try {
      const template = await Template.findByIdAndDelete(req.params.templateId);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Template deletion error:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  }
);

// WiFi Issue Fix - Format message properly
app.post("/api/guest/:hotelId/:roomId/request", async (req, res) => {
  const { hotelId, roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Invalid hotel ID" });
  }

  try {
    // ✅ Find the actual room using UUID
    console.log("Looking for room:", {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId,
    });
    const room = await Room.findOne({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId,
    });
    console.log("Room found:", room);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requestData = req.body;

    // ✅ Process different request types and create proper message
    let message = "";
    let orderDetails = null;

    if (requestData.type === "order-food" && requestData.orderDetails) {
      const order = requestData.orderDetails;
      message = `Food Order:\n${order.items
        .map(
          (item) =>
            `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`
        )
        .join("\n")}\nTotal: ₹${order.total}`;
      orderDetails = {
        items: order.items.map((item) => ({
          itemId: null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        totalAmount: order.total,
      };
    } else if (
      requestData.type === "room-service" &&
      requestData.serviceDetails
    ) {
      const service = requestData.serviceDetails;
      message = `Room Service Request: ${service.serviceName}\nCategory: ${
        service.category
      }\nEstimated Time: ${service.estimatedTime}\nDescription: ${
        service.description || "N/A"
      }`;
    } else if (
      requestData.type === "complaint" &&
      requestData.complaintDetails
    ) {
      const complaint = requestData.complaintDetails;
      message = `Issue: ${complaint.complaintName}\nCategory: ${
        complaint.category
      }\nPriority: ${complaint.priority}\nDescription: ${
        complaint.description || "N/A"
      }`;
    } else if (
      requestData.type === "custom-message" &&
      requestData.customMessageDetails
    ) {
      message = `Message: ${requestData.customMessageDetails.message}`;
    } else {
      message = requestData.message || "No additional details provided";
    }

    const request = new Request({
      hotelId,
      roomId: room._id,
      roomNumber: room.number,
      guestPhone: requestData.guestPhone,
      type: requestData.type,
      message: message,
      orderDetails: orderDetails,
      priority: requestData.priority || "medium",
      status: "pending",
    });

    await request.save();

    // ✅ Emit real-time notification to admin dashboard
    console.log("🔔 Emitting newRequest to hotel room:", hotelId);
    io.to(hotelId).emit("newRequest", request);

    res
      .status(201)
      .json({ message: "Request submitted successfully", request });
  } catch (error) {
    console.error("Guest request error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  // console.log('User connected:', socket.id);

  socket.on("joinHotel", (hotelId) => {
    socket.join(hotelId);
    // console.log(`User joined hotel room: ${hotelId}`);
  });

  socket.on("disconnect", () => {
    // console.log('User disconnected:', socket.id);
  });
});

// Routes
app.get("/", (req, res) => {
  res.send("Developer Sparsh -> https://sparshsingh.netlify.app/");
});

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      hotelName,
      email,
      password,
      phone,
      address,
      totalRooms,
      adminName,
    } = req.body;

    // Check if hotel already exists
    const existingHotel = await Hotel.findOne({ email });
    if (existingHotel) {
      return res
        .status(400)
        .json({ message: "Hotel already registered with this email" });
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
      role: "admin",
      hotelId: hotel._id,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, hotelId: hotel._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
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
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Get hotel data
    const hotel = await Hotel.findById(user.hotelId);
    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, hotelId: hotel._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
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
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

//Razorpay route
app.post("/api/subscribe", authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;

    // Plan pricing logic
    const prices = {
      basic: 99900, // ₹999 in paise
      premium: 199900, // ₹1999 in paise
    };

    const amount = prices[plan];
    if (!amount) return res.status(400).json({ message: "Invalid plan" });

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
    res.status(500).json({ message: "Failed to create order" });
  }
});

// POST /api/payment/webhook
app.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;

    const isValid = Razorpay.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      secret
    );

    if (!isValid) return res.status(400).send("Invalid signature");

    const payment = body.payload.payment.entity;

    const userId = payment.notes.userId;
    const plan = payment.notes.plan;
    const duration = parseInt(payment.notes.duration);

    const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    // Update in DB
    await Hotel.updateOne(
      { admin: userId },
      {
        subscription: {
          plan,
          status: "active",
          expiresAt,
        },
      }
    );

    return res.status(200).json({ success: true });
  }
);

// Hotel routes
app.get("/api/hotels/:id", authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/hotels/:id", authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Room routes
app.get("/api/hotels/:hotelId/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({ hotelId: req.params.hotelId });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/hotels/:hotelId/rooms", authenticateToken, async (req, res) => {
  try {
    const { number, name } = req.body;
    const { hotelId } = req.params;

    // Check for duplicate room
    const existingRoom = await Room.findOne({ hotelId, number });
    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    // Generate UUID
    const roomUuid = uuidv4();

    // Generate QR code with UUID
    const qrData = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/guest/${hotelId}/${roomUuid}`;
    const qrCode = await qrcode.toDataURL(qrData);

    // Create Room with UUID
    const room = new Room({
      hotelId,
      number,
      name,
      uuid: roomUuid, // ✅ Save uuid
      qrCode, // ✅ Save QR image
    });

    await room.save();
    // console.log("✅ Room created successfully");

    res.json(room);
  } catch (error) {
    console.error("❌ Room creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put(
  "/api/hotels/:hotelId/rooms/:roomId",
  authenticateToken,
  async (req, res) => {
    try {
      const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, {
        new: true,
      });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/hotels/:hotelId/rooms/:roomId",
  authenticateToken,
  async (req, res) => {
    try {
      const room = await Room.findByIdAndDelete(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Request routes
app.get(
  "/api/hotels/:hotelId/requests",
  authenticateToken,
  async (req, res) => {
    try {
      const requests = await Request.find({ hotelId: req.params.hotelId }).sort(
        { createdAt: -1 }
      );
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/hotels/:hotelId/requests",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId, type, message, priority, guestPhone, orderDetails } =
        req.body;
      const { hotelId } = req.params;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const request = new Request({
        hotelId,
        roomId: room._id,
        roomNumber: room.number,
        guestPhone: requestData.guestPhone,
        type: requestData.type,
        message: requestData.message,
        orderDetails: requestData.orderDetails,
        priority: requestData.priority || "medium",
        status: "pending",
      });

      await request.save();

      // Emit real-time notification
      io.to(hotelId).emit("newRequest", request);

      res.json(request);
    } catch (error) {
      console.error("Request creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/hotels/:hotelId/requests/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const request = await Request.findByIdAndUpdate(
        req.params.requestId,
        req.body,
        { new: true }
      );
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Emit real-time update
      io.to(req.params.hotelId).emit("requestUpdated", request);

      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Guest Food Menu Route (no auth required)
app.get("/api/guest/:hotelId/food-menu", async (req, res) => {
  try {
    const { hotelId } = req.params;
    // console.log('Fetching food menu for hotel:', hotelId);

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      // console.log('Invalid hotelId:', hotelId);
      return res.status(400).json({ message: "Invalid hotelId" });
    }

    const foodItems = await FoodItem.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      isAvailable: true,
    });

    // console.log('Found food items:', foodItems.length);
    res.json(foodItems);
  } catch (error) {
    console.error("Guest food menu error:", error.stack || error);
    res.status(500).json({ message: "Server error" });
  }
});

// Guest Room Service Menu Route (no auth required)
app.get("/api/guest/:hotelId/room-service-menu", async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid hotelId" });
    }

    const roomServiceItems = await RoomServiceItem.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      isAvailable: true,
    });

    res.json(roomServiceItems);
  } catch (error) {
    console.error("Guest room service menu error:", error.stack || error);
    res.status(500).json({ message: "Server error" });
  }
});

// Guest Complaint Menu Route (no auth required)
app.get("/api/guest/:hotelId/complaint-menu", async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid hotelId" });
    }

    const complaintItems = await ComplaintItem.find({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      isAvailable: true,
    });

    res.json(complaintItems);
  } catch (error) {
    console.error("Guest complaint menu error:", error.stack || error);
    res.status(500).json({ message: "Server error" });
  }
});

// Guest portal routes (no authentication required)
app.get("/api/guest/:hotelId/:roomId", async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    // Cast hotelId to ObjectId for query
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // FIX: Use 'new' with ObjectId
    const room = await Room.findOne({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId,
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
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
    console.error("Error fetching guest portal data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/guest/:hotelId/:roomId/request", async (req, res) => {
  const { hotelId, roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Invalid hotel ID" });
  }

  try {
    // ✅ Find the actual room using UUID
    // console.log('Looking for room:', {
    //   hotelId: new mongoose.Types.ObjectId(hotelId),
    //   uuid: roomId
    // });
    const room = await Room.findOne({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      uuid: roomId,
    });
    // console.log('Room found:', room);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requestData = req.body;

    // ✅ Process different request types and create proper message
    let message = "";
    let orderDetails = null;

    if (requestData.type === "order-food" && requestData.orderDetails) {
      const order = requestData.orderDetails;
      message = `Food Order:\n${order.items
        .map(
          (item) =>
            `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`
        )
        .join("\n")}\nTotal: ₹${order.total}`;
      orderDetails = {
        items: order.items.map((item) => ({
          itemId: null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        totalAmount: order.total,
      };
    } else if (
      requestData.type === "room-service" &&
      requestData.serviceDetails
    ) {
      const service = requestData.serviceDetails;
      message = `Room Service Request: ${service.serviceName}\nCategory: ${
        service.category
      }\nEstimated Time: ${service.estimatedTime}\nDescription: ${
        service.description || "N/A"
      }`;
    } else if (
      requestData.type === "complaint" &&
      requestData.complaintDetails
    ) {
      const complaint = requestData.complaintDetails;
      message = `Complaint: ${complaint.complaintName}\nCategory: ${
        complaint.category
      }\nPriority: ${complaint.priority}\nDescription: ${
        complaint.description || "N/A"
      }`;
    } else if (
      requestData.type === "custom-message" &&
      requestData.customMessageDetails
    ) {
      message = requestData.customMessageDetails.message;
    } else if (
      requestData.type === "wifi-support" &&
      requestData.wifiSupportDetails
    ) {
      const wifiSupport = requestData.wifiSupportDetails;
      message = `WiFi Support Request: ${wifiSupport.issueType}\nCategory: ${
        wifiSupport.category
      }\nPriority: ${wifiSupport.priority}\nDescription: ${
        wifiSupport.description || "N/A"
      }`;
    } else if (
      requestData.type === "security-alert" &&
      requestData.securityAlertDetails
    ) {
      const securityAlert = requestData.securityAlertDetails;
      message = `🚨 SECURITY ALERT: ${securityAlert.alertType}\nCategory: ${
        securityAlert.category
      }\nPriority: ${securityAlert.priority}\nDescription: ${
        securityAlert.description || "N/A"
      }`;
    } else {
      message = requestData.message || "No additional details provided";
    }

    const request = new Request({
      hotelId,
      roomId: room._id,
      roomNumber: room.number,
      guestPhone: requestData.guestPhone,
      type: requestData.type,
      message: message,
      orderDetails: orderDetails,
      priority: requestData.priority || "medium",
      status: "pending",
    });

    await request.save();

    // ✅ Emit real-time notification to admin dashboard
    // console.log('🔔 Emitting newRequest to hotel room:', hotelId);
    io.to(hotelId).emit("newRequest", request);

    res
      .status(201)
      .json({ message: "Request submitted successfully", request });
  } catch (err) {
    console.error("Guest request error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Food Menu Routes
app.get(
  "/api/hotels/:hotelId/food-menu",
  authenticateToken,
  async (req, res) => {
    try {
      const foodItems = await FoodItem.find({ hotelId: req.params.hotelId });
      res.json(foodItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/hotels/:hotelId/food-menu",
  authenticateToken,
  async (req, res) => {
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
      console.error("Food item creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/hotels/:hotelId/food-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const foodItem = await FoodItem.findByIdAndUpdate(
        req.params.itemId,
        req.body,
        { new: true }
      );
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json(foodItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/hotels/:hotelId/food-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const foodItem = await FoodItem.findByIdAndDelete(req.params.itemId);
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json({ message: "Food item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Room Service Menu Routes
app.get(
  "/api/hotels/:hotelId/room-service-menu",
  authenticateToken,
  async (req, res) => {
    try {
      const roomServiceItems = await RoomServiceItem.find({
        hotelId: req.params.hotelId,
      });
      res.json(roomServiceItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/hotels/:hotelId/room-service-menu",
  authenticateToken,
  async (req, res) => {
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
      console.error("Room service item creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/hotels/:hotelId/room-service-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const roomServiceItem = await RoomServiceItem.findByIdAndUpdate(
        req.params.itemId,
        req.body,
        { new: true }
      );
      if (!roomServiceItem) {
        return res.status(404).json({ message: "Room service item not found" });
      }
      res.json(roomServiceItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/hotels/:hotelId/room-service-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const roomServiceItem = await RoomServiceItem.findByIdAndDelete(
        req.params.itemId
      );
      if (!roomServiceItem) {
        return res.status(404).json({ message: "Room service item not found" });
      }
      res.json({ message: "Room service item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Complaint Menu Routes
app.get(
  "/api/hotels/:hotelId/complaint-menu",
  authenticateToken,
  async (req, res) => {
    try {
      const complaintItems = await ComplaintItem.find({
        hotelId: req.params.hotelId,
      });
      res.json(complaintItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/hotels/:hotelId/complaint-menu",
  authenticateToken,
  async (req, res) => {
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
      console.error("Complaint item creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/hotels/:hotelId/complaint-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const complaintItem = await ComplaintItem.findByIdAndUpdate(
        req.params.itemId,
        req.body,
        { new: true }
      );
      if (!complaintItem) {
        return res.status(404).json({ message: "Complaint item not found" });
      }
      res.json(complaintItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/hotels/:hotelId/complaint-menu/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const complaintItem = await ComplaintItem.findByIdAndDelete(
        req.params.itemId
      );
      if (!complaintItem) {
        return res.status(404).json({ message: "Complaint item not found" });
      }
      res.json({ message: "Complaint item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `MongoDB URI: ${
      process.env.MONGODB_URI ? "Connected" : "Using default localhost"
    }`
  );
  console.log(
    `JWT Secret: ${process.env.JWT_SECRET ? "Set" : "Using default"}`
  );
});
