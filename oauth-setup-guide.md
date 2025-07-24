# 🔐 Google OAuth Setup Guide for ProfitLabs

## 📋 Step-by-Step Google Cloud Console Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"New Project"** or select existing project
3. Name your project: `ProfitLabs-Reviews`
4. Click **"Create"**

### 2. Enable Required APIs
1. Go to **"APIs & Services"** → **"Library"**
2. Search and enable these APIs:
   - ✅ **Google My Business API**
   - ✅ **Google+ API** (for user info)
   - ✅ **Google OAuth2 API**

### 3. Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for testing) or **"Internal"** (for organization)
3. Fill required fields:
   - **App name**: `ProfitLabs Suite`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/business.manage`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (your email) if using External
6. Click **"Save and Continue"**

### 4. Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"**
4. Name: `ProfitLabs OAuth Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   https://your-domain.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:5173/auth/google/callback
   https://your-domain.com/auth/google/callback
   ```
7. Click **"Create"**
8. **Copy Client ID and Client Secret** 📋

### 5. Update Environment Variables
Add to your `.env` file:
```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Optional: OpenAI (for advanced AI)
OPENAI_API_KEY=sk-your-openai-key-here
```

## 🚨 Common Issues & Solutions

### ❌ "redirect_uri_mismatch" Error
- **Problem**: Redirect URI doesn't match
- **Solution**: Ensure exact match in Google Console and your app URL

### ❌ "access_denied" Error
- **Problem**: Missing scopes or consent screen not approved
- **Solution**: Add required scopes and complete consent screen setup

### ❌ "invalid_client" Error
- **Problem**: Wrong Client ID or Secret
- **Solution**: Double-check credentials from Google Console

## 🧪 Testing Your Setup
1. Go to Admin Dashboard → **"Test API"** tab
2. Click **"Test Google OAuth"**
3. Should show ✅ green if configured correctly

## 🔄 OAuth Flow in Your App
1. User clicks **"Connect Google My Business"**
2. Redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Your app exchanges code for access token
6. App can now fetch Google My Business reviews

## 📞 Need Help?
- Check the **Test API** tab for specific error messages
- Verify all URLs match exactly (including http/https)
- Ensure APIs are enabled in Google Cloud Console
- Make sure OAuth consent screen is published (not in testing mode for production)