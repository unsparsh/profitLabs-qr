# ProfitLabs - Hotel Room Service SaaS Platform

A comprehensive web application that modernizes hotel room service by replacing traditional landline phones with QR code-based mobile portals. Hotels can manage guest requests in real-time through a professional admin dashboard.

## 🌟 Features

### Guest Portal (Mobile-First)
- **QR Code Access**: Guests scan QR codes placed in rooms to access services
- **Service Options**: Call Service Boy, Order Food, Request Room Service, Lodge Complaints
- **Custom Messages**: Flexible messaging system for specific requests
- **Instant Submission**: Real-time request submission with confirmation

### Admin Dashboard
- **Real-time Updates**: Live notifications when guests submit requests
- **Request Management**: View, update, and track all guest requests
- **Room Management**: Generate QR codes for each room, enable/disable rooms
- **Analytics**: Visual charts showing request patterns and hotel performance
- **Settings**: Configure available services and notification preferences

### SaaS Features
- **Multi-tenant Architecture**: Each hotel operates independently
- **Subscription Management**: Trial, Basic, and Premium plans
- **Onboarding Wizard**: Easy setup for new hotels
- **Payment Integration**: Stripe-ready for subscription billing

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time updates
- **React Hook Form** with Zod validation
- **Recharts** for analytics visualization

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose
- **JWT Authentication**
- **QR Code Generation**
- **bcryptjs** for password hashing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd profitlabs
```

### 2. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd server
npm install
```

### 3. Environment Setup

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

#### Backend (.env)
```bash
MONGODB_URI=mongodb://localhost:27017/profitlabs
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 4. Start the Application

#### Start Backend Server
```bash
cd server
npm run dev
```

#### Start Frontend (in another terminal)
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🏗️ Project Structure

```
profitlabs/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── admin/         # Admin dashboard components
│   │   └── guest/         # Guest portal components
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and API client
│   └── App.tsx            # Main application component
├── server/
│   ├── index.js           # Express server and Socket.IO setup
│   └── package.json       # Backend dependencies
├── public/                # Static assets
└── README.md
```

## 📱 Usage

### For Hotels (Admin)

1. **Registration**
   - Visit `/auth` and click "Sign up here"
   - Fill in hotel details and admin information
   - Get instant access to admin dashboard

2. **Room Setup**
   - Navigate to "Rooms" tab
   - Add rooms with numbers and names
   - Download QR codes for each room
   - Print and place QR codes in corresponding rooms

3. **Request Management**
   - Monitor incoming requests in real-time
   - Update request status (pending → in-progress → completed)
   - View analytics and request history

4. **Configuration**
   - Enable/disable specific services
   - Configure notification preferences
   - Manage subscription settings

### For Guests

1. **Access Portal**
   - Scan QR code in hotel room
   - Opens mobile-optimized web portal

2. **Submit Requests**
   - Choose from available services
   - Send custom messages
   - Receive confirmation

## 🔧 Configuration

### Service Configuration
Hotels can enable/disable the following services:
- Call Service Boy
- Order Food
- Request Room Service
- Lodge Complaint
- Custom Message

### Notification Settings
- Sound notifications for new requests
- Email notifications (configurable)

### Subscription Plans
- **Trial**: 30 days free, all features
- **Basic**: Essential features for small hotels
- **Premium**: Advanced features for large hotels

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Backend (Railway/Heroku)
```bash
# Set environment variables
# Deploy to Railway or Heroku
```

### Environment Variables for Production
```bash
# Backend
MONGODB_URI=mongodb+srv://your-cluster-url
JWT_SECRET=your-production-secret
CLIENT_URL=https://your-domain.com

# Frontend
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Multi-tenant data isolation
- CORS configuration
- Input validation and sanitization

## 📊 Analytics & Monitoring

The admin dashboard provides:
- Real-time request statistics
- Weekly request trends
- Request type distribution
- Completion rates
- Response time metrics

## 🔄 Real-time Features

- Instant request notifications
- Live request status updates
- Sound notifications for urgency
- Real-time dashboard updates

## 🎯 Future Enhancements

- Mobile app for staff
- Advanced analytics and reporting
- Integration with hotel management systems
- Multi-language support
- Advanced role-based permissions
- Automated staff assignment

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and questions:
- Email: support@profitlabs.com
- Documentation: [docs.profitlabs.com]
- Status: [status.profitlabs.com]

## 🏆 Contributing

This is a private project. Contributions are welcome from authorized team members only.

---

**ProfitLabs** - Transforming hotel guest services with modern technology.