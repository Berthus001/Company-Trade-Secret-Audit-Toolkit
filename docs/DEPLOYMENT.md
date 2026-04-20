# Deployment Guide

## Company Trade Secret Audit Toolkit - Deployment Instructions

### Overview

This guide covers deploying the MERN application using:
- **Database**: MongoDB Atlas (Cloud)
- **Backend**: Render (Free tier available)
- **Frontend**: Vercel (Free tier available)

---

## 1. MongoDB Atlas Setup

### Step 1: Create Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Verify your email address

### Step 2: Create Cluster
1. Click "Build a Database"
2. Select "M0 FREE" tier
3. Choose cloud provider (AWS recommended)
4. Select region closest to your users
5. Name your cluster (e.g., "trade-secret-audit-cluster")
6. Click "Create Cluster"

### Step 3: Configure Access

**Create Database User:**
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and generate strong password
5. Save credentials securely
6. Set privileges to "Read and write to any database"
7. Click "Add User"

**Configure Network Access:**
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Add your current IP
4. For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: This is less secure but necessary for cloud deployments
5. Click "Confirm"

### Step 4: Get Connection String
1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Choose "Node.js" and version "4.1 or later"
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your credentials
6. Add database name before the `?`:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/trade_secret_audit_db?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

**Create `render.yaml` in backend root:**
```yaml
services:
  - type: web
    name: trade-secret-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 2: Deploy to Render

1. Go to [https://render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Select the backend folder as root directory
6. Configure settings:
   - **Name**: trade-secret-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
7. Add Environment Variables:
   ```
   NODE_ENV = production
   MONGO_URI = mongodb+srv://...your-connection-string...
   JWT_SECRET = your-super-secret-jwt-key-at-least-32-characters
   FRONTEND_URL = https://your-frontend-url.vercel.app
   ```
8. Click "Create Web Service"
9. Wait for deployment (first deploy takes ~5 minutes)
10. Copy your backend URL (e.g., `https://trade-secret-api.onrender.com`)

### Step 3: Verify Backend

Test your deployed API:
```bash
curl https://trade-secret-api.onrender.com/api/health
```

Expected response:
```json
{"status": "OK", "message": "Server is running"}
```

---

## 3. Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Deployment

**Create `vercel.json` in frontend root:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Update `.env.production`:**
```
REACT_APP_API_URL=https://trade-secret-api.onrender.com/api
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: trade-secret-audit
# - Directory: ./
# - Override settings? No
```

**Option B: Via Vercel Dashboard**
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: frontend
6. Add Environment Variables:
   ```
   REACT_APP_API_URL = https://trade-secret-api.onrender.com/api
   ```
7. Click "Deploy"
8. Wait for deployment (~2 minutes)

### Step 3: Update Backend CORS

After getting your Vercel URL, update the backend environment variable:
```
FRONTEND_URL = https://trade-secret-audit.vercel.app
```

Redeploy backend on Render to apply changes.

---

## 4. Post-Deployment Setup

### Seed Questions Database

After both services are deployed, seed the database with audit questions:

**Option 1: Using API**
```bash
curl -X POST https://trade-secret-api.onrender.com/api/questions/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>"
```

**Option 2: Using MongoDB Compass**
1. Connect to your Atlas cluster
2. Import questions from `backend/data/questions.json`

### Verify Full Stack

1. Open your Vercel URL in browser
2. Register a new account
3. Login with credentials
4. Complete an audit
5. View results

---

## 5. Environment Variables Summary

### Backend (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | `production` |
| PORT | Server port | `5000` (auto-set by Render) |
| MONGO_URI | MongoDB connection string | `mongodb+srv://...` |
| JWT_SECRET | JWT signing secret | `your-32-char-secret` |
| FRONTEND_URL | Allowed CORS origin | `https://app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | `https://api.onrender.com/api` |

---

## 6. Monitoring & Maintenance

### Render Dashboard
- View deployment logs
- Monitor CPU/Memory usage
- Set up auto-deploy from Git

### Vercel Dashboard
- View deployment history
- Check build logs
- Preview deployments

### MongoDB Atlas
- Monitor database metrics
- Set up alerts for:
  - High CPU usage
  - Connection limits
  - Storage approaching limit

---

## 7. Troubleshooting

### Common Issues

**Backend not connecting to MongoDB:**
- Verify MONGO_URI is correct
- Check Network Access allows 0.0.0.0/0
- Verify database user credentials

**CORS Errors:**
- Ensure FRONTEND_URL matches Vercel domain exactly
- Include protocol (https://)
- No trailing slash

**Frontend can't reach backend:**
- Verify REACT_APP_API_URL is set
- Check backend is running (health endpoint)
- Verify no typos in URL

**JWT Errors:**
- Ensure JWT_SECRET is same across restarts
- Token may be expired (re-login)

### Render Free Tier Notes
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider paid tier for production use

---

## 8. Security Checklist for Production

- [ ] Strong JWT_SECRET (random, 32+ characters)
- [ ] MongoDB user has minimal required permissions
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Environment variables not exposed in code
- [ ] Rate limiting configured
- [ ] Error messages don't expose stack traces
- [ ] Regular dependency updates

---

## 9. Custom Domain Setup

### Vercel Custom Domain
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as shown
4. Wait for SSL certificate (automatic)

### Render Custom Domain
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Configure CNAME record
4. SSL certificate auto-provisioned

---

## Quick Reference Commands

```bash
# Local Development
cd backend && npm run dev
cd frontend && npm start

# Deploy Backend (if using Render CLI)
render deploy

# Deploy Frontend
vercel --prod

# View Logs
render logs --service trade-secret-api
vercel logs

# Check API Health
curl https://your-api.onrender.com/api/health
```
