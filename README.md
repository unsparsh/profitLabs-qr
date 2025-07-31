# ProfitLabs QR - Codebase Architecture Guide

Welcome to ProfitLabs! This is a comprehensive hotel room service SaaS platform that modernizes guest services through QR code technology. Here's everything you need to know about the architecture:

## 🏗️ **High-Level Architecture**

ProfitLabs follows a **full-stack web application architecture** with clear separation between frontend and backend:

- **Frontend**: React 18 + TypeScript SPA (Single Page Application)
- **Backend**: Node.js + Express REST API with Socket.IO for real-time features
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO for live updates
- **Authentication**: JWT-based with Google OAuth integration

## 📁 **Project Structure**

```
profitlabs-qr/
├── src/                          # Frontend React application
│   ├── components/               # React components organized by feature
│   │   ├── admin/               # Admin dashboard components
│   │   ├── auth/                # Authentication components
│   │   ├── guest/               # Guest portal components
│   │   └── ui/                  # Reusable UI components
│   ├── contexts/                # React Context providers
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions and API client
│   └── App.tsx                  # Main application component
├── server/                      # Backend Node.js application
│   ├── index.js                 # Main server file with all routes
│   └── package.json             # Backend dependencies
├── public/                      # Static assets
└── package.json                 # Frontend dependencies
```

## 🎯 **Core Business Logic**

### **Multi-Tenant SaaS Model**
- Each hotel operates as an independent tenant
- Hotels have their own rooms, requests, menus, and settings
- Data isolation through `hotelId` in all database schemas

### **QR Code Workflow**
1. Hotels generate QR codes for each room
2. Guests scan QR codes to access mobile portal
3. Guests submit service requests through the portal
4. Hotel staff receive real-time notifications
5. Staff manage requests through admin dashboard

## 🔧 **Technology Stack Deep Dive**

### **Frontend Technologies**
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Router**: Client-side routing with protected routes
- **React Hook Form + Zod**: Form handling with validation
- **Socket.IO Client**: Real-time communication
- **Recharts**: Data visualization for analytics
- **React Hot Toast**: User notifications
- **Vite**: Fast build tool and development server

### **Backend Technologies**
- **Node.js + Express**: RESTful API server
- **MongoDB + Mongoose**: NoSQL database with ODM
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: Stateless authentication
- **bcryptjs**: Password hashing
- **QR Code**: QR code generation
- **Google APIs**: OAuth and Business integration
- **OpenAI**: AI assistant features
- **Razorpay**: Payment processing

## 🗄️ **Database Schema Design**

### **Core Entities**
1. **Hotel**: Main tenant entity with subscription and settings
2. **User**: Hotel staff with role-based access
3. **Room**: Individual hotel rooms with QR codes
4. **Request**: Guest service requests with status tracking
5. **FoodItem/RoomServiceItem/ComplaintItem**: Configurable service menus

### **Key Relationships**
- Hotels → Users (1:many)
- Hotels → Rooms (1:many)
- Hotels → Requests (1:many)
- Rooms → Requests (1:many)

## 🔄 **Data Flow Architecture**

### **Guest Request Flow**
1. Guest scans QR code → `/guest/:hotelId/:roomId`
2. Frontend fetches hotel/room data via API
3. Guest submits request → API creates request in database
4. Socket.IO broadcasts real-time notification to admin
5. Admin updates request status → Real-time update to all connected clients

### **Authentication Flow**
1. Hotel registers → Creates hotel + admin user
2. Login → JWT token stored in localStorage
3. API requests include JWT in Authorization header
4. Protected routes check authentication status

## 🎨 **Component Architecture**

### **Route Structure**
- `/auth` - Authentication (login/register)
- `/admin` - Protected admin dashboard
- `/guest/:hotelId/:roomId` - Public guest portal
- `/pricing` - Subscription plans
- `/auth/google/callback` - OAuth callback

### **Key Components**
- **App.tsx**: Main router and authentication logic
- **AdminDashboard**: Multi-tab interface for hotel management
- **GuestPortal**: Mobile-first interface for guest requests
- **AuthContext**: Global authentication state management

## 🔌 **API Design**

### **RESTful Endpoints**
- `POST /api/auth/login` - User authentication
- `GET /api/hotels/:id/rooms` - Fetch hotel rooms
- `POST /api/hotels/:id/requests` - Create guest request
- `PUT /api/hotels/:id/requests/:requestId` - Update request status

### **Real-time Events**
- `new-request` - Broadcast new guest requests
- `request-updated` - Notify status changes
- `join-hotel` - Subscribe to hotel-specific events

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js v16+
- MongoDB (local or cloud)
- Environment variables configured

### **Getting Started**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install

# Start backend (terminal 1)
cd server && npm run dev

# Start frontend (terminal 2)
npm run dev
```

### **Environment Configuration**
- **Frontend**: `VITE_API_URL`, `VITE_SOCKET_URL`
- **Backend**: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.

## 🔐 **Security Features**

- JWT-based stateless authentication
- Password hashing with bcryptjs
- CORS configuration for cross-origin requests
- Multi-tenant data isolation
- Input validation and sanitization

## 📊 **Key Features by Module**

### **Admin Dashboard**
- Real-time request management
- Room and QR code generation
- Analytics and reporting
- Menu configuration (food, room service, complaints)
- Google Business integration
- AI assistant for review responses

### **Guest Portal**
- Mobile-first responsive design
- Service request submission
- Order placement with menu selection
- Real-time confirmation

### **SaaS Features**
- Multi-tenant architecture
- Subscription management (trial/basic/premium)
- Payment integration with Razorpay
- Onboarding workflow

## 🚀 **Deployment Architecture**

- **Frontend**: Static build deployed to Vercel/Netlify
- **Backend**: Node.js server on Railway/Heroku
- **Database**: MongoDB Atlas (cloud)
- **Real-time**: Socket.IO with sticky sessions

## 🔄 **State Management**

- **Local State**: React useState for component state
- **Global State**: React Context for authentication
- **Server State**: Direct API calls with real-time Socket.IO updates
- **Persistence**: localStorage for authentication tokens

This architecture provides a scalable, maintainable foundation for the hotel room service platform with clear separation of concerns and modern development practices.
