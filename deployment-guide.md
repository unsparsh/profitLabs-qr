# 🚀 ProfitLabs Full-Stack Deployment Guide

## 📋 Prerequisites
1. **MongoDB Atlas Account** (free tier available)
2. **Railway/Render Account** (for backend)
3. **Netlify Account** (for frontend - already done)

## 🗄️ Step 1: Setup MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Whitelist all IPs (0.0.0.0/0) for development

## 🖥️ Step 2: Deploy Backend to Railway

### Option A: Railway (Recommended)
1. Go to [Railway](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your repository
5. Select the `server` folder as root directory
6. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/profitlabs
   JWT_SECRET=your-super-secret-jwt-key-for-production
   CLIENT_URL=https://teal-empanada-63bc0e.netlify.app
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```
7. Deploy and get your backend URL

### Option B: Render
1. Go to [Render](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add same environment variables as above

## 🌐 Step 3: Update Frontend Configuration

After backend deployment, update your frontend:

1. **Update .env file** with your backend URL:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```

2. **Redeploy frontend** to Netlify with updated configuration

## 🔧 Step 4: Test the Application

1. **Admin Portal**: https://teal-empanada-63bc0e.netlify.app/auth
2. **Register** a new hotel
3. **Add rooms** and generate QR codes
4. **Test guest portal** by scanning QR codes

## 📱 Step 5: QR Code Testing

1. Go to Admin → Rooms
2. Add a room (e.g., "Room 101")
3. Download the QR code
4. Scan with phone camera
5. Should open: `https://teal-empanada-63bc0e.netlify.app/guest/hotelId/roomId`

## 🔐 Security Notes

- Use strong JWT secrets in production
- Use MongoDB Atlas with proper authentication
- Use HTTPS for all communications
- Keep API keys secure

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure CLIENT_URL matches your Netlify URL
2. **Database Connection**: Check MongoDB Atlas IP whitelist
3. **API Calls Failing**: Verify VITE_API_URL is correct
4. **Socket.IO Issues**: Ensure VITE_SOCKET_URL matches backend

### Debug Steps:
1. Check browser console for errors
2. Check backend logs in Railway/Render
3. Verify environment variables are set
4. Test API endpoints directly

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify all environment variables
3. Test API endpoints with Postman
4. Check MongoDB Atlas connection

---

**Your Application URLs:**
- **Frontend**: https://teal-empanada-63bc0e.netlify.app
- **Backend**: [Deploy and update this]
- **Admin**: https://teal-empanada-63bc0e.netlify.app/auth