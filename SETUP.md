# LabChain Setup Guide

Complete setup instructions for running all LabChain servers, perfect for beginners.

## 📋 Table of Contents

1. [User Flow Overview](#user-flow-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start Guide](#quick-start-guide)
4. [Detailed Setup Instructions](#detailed-setup-instructions)
   - [Next.js Application](#1-nextjs-application)
   - [Socket.IO Server](#2-socketio-server)
   - [ML Server (FastAPI)](#3-ml-server-fastapi)
5. [Running All Servers](#running-all-servers)
6. [Troubleshooting](#troubleshooting)

---

## 👥 User Flow Overview

### New User Journey

1. **Landing Page** (`/`)
   - User sees LabChain features and value proposition
   - Clicks "Get Started" or "View Dashboard"

2. **Sign Up** (`/signup`)
   - User creates account with:
     - Full name
     - Email
     - Institution
     - Password
   - Account is created in MongoDB
   - User is automatically logged in

3. **Dashboard** (`/dashboard`)
   - Overview of user's activity:
     - Active notebooks count
     - Protocols count
     - Replications tracking
     - Success rate statistics
   - Recent activity feed

4. **Create Lab Notebook** (`/notebook`)
   - Click "New Notebook"
   - Opens real-time collaborative editor
   - Features:
     - Live editing with auto-save (every 3 seconds)
     - Voice-to-text transcription
     - Real-time collaboration via Socket.IO
     - Version history

5. **Build Protocol** (`/protocols`)
   - Click "New Protocol"
   - Drag-and-drop step builder:
     - Add/reorder steps
     - Each step has: reagents, timing, equipment, notes
   - AI autocomplete suggests next steps (via ML server)
   - Version control (like Git)
   - Save as draft or publish

6. **Replicate Experiment** (`/replications`)
   - Browse protocols from other researchers
   - Start replication of a protocol
   - Track replication status:
     - In progress
     - Completed
     - Verified (with cryptographic signature)
   - View who replicated your protocols

7. **Verification Network**
   - Researchers verify each other's replications
   - Institution-signed verification badges
   - Cryptographic signatures for data integrity

### Core User Flows

**Flow 1: Creating a Protocol**
```
Dashboard → Protocols → New Protocol → 
Build Steps (drag & drop) → 
Add Reagents/Equipment → 
AI Autocomplete (optional) → 
Save → Create Version
```

**Flow 2: Real-time Collaboration**
```
Notebook → Open/Create → 
Start Typing → 
Auto-save (3s) → 
Others see changes in real-time → 
Voice-to-text available
```

**Flow 3: Replicating & Verifying**
```
Browse Protocols → 
Start Replication → 
Follow Protocol Steps → 
Record Results → 
Sign Cryptographically → 
Get Verified by Institutions
```

---

## 📦 Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
   ```bash
   node --version  # Should show v18 or higher
   npm --version
   ```

2. **Python 3.9+** - [Download here](https://www.python.org/downloads/)
   ```bash
   python3 --version  # Should show 3.9 or higher
   ```

3. **MongoDB** - Choose one:
   - **Option A: Local MongoDB** - [Install locally](https://www.mongodb.com/try/download/community)
   - **Option B: MongoDB Atlas** (Free tier) - [Sign up here](https://www.mongodb.com/cloud/atlas/register)

4. **Git** - Already installed if you cloned the repo

---

## 🚀 Quick Start Guide

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd labchainx

# Install Next.js dependencies
npm install

# Install Socket.IO server dependencies
cd socket-server
npm install
cd ..

# Install ML server dependencies (see detailed instructions below)
cd ml-server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Set Up Environment Variables

Create `.env.local` in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
MONGODB_URI=mongodb://localhost:27017/labchain
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_ML_SERVER_URL=http://localhost:8000

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Run All Servers

You'll need **3 terminal windows**:

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Socket.IO Server:**
```bash
cd socket-server
npm start
```

**Terminal 3 - ML Server:**
```bash
cd ml-server
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

Visit: **http://localhost:3000**

---

## 📖 Detailed Setup Instructions

### 1. Next.js Application

#### Step 1: Install Dependencies

```bash
cd labchainx
npm install
```

This installs all Next.js, React, and other frontend dependencies.

#### Step 2: Configure Environment Variables

Create `.env.local` in the root directory:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your favorite editor
nano .env.local  # or code .env.local, vim .env.local, etc.
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET` value.

**For MongoDB Atlas (Cloud):**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Replace `<password>` and `<dbname>` in the connection string

**For Cloudinary (Image Uploads):**
1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account
2. Navigate to Dashboard
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret
4. Add them to `.env.local` as shown above

#### Step 3: Run Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

---

### 2. Socket.IO Server

The Socket.IO server handles real-time collaboration for notebooks.

#### Step 1: Navigate to Socket Server Directory

```bash
cd socket-server
```

#### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `socket.io` - WebSocket server
- `jsonwebtoken` - JWT authentication

#### Step 3: Set Up Environment Variables

Create `.env` file in `socket-server/`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key-same-as-nextauth-secret
PORT=3001
NEXTAUTH_SECRET=your-secret-key-same-as-nextauth-secret
```

**Important:** Use the same `NEXTAUTH_SECRET` as your Next.js app for JWT verification.

#### Step 4: Run the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
node index.js
```

Server starts at **http://localhost:3001**

You should see:
```
Socket.IO server running on port 3001
```

---

### 3. ML Server (FastAPI)

**FastAPI is a modern Python web framework.** If you're new to FastAPI/Flask, here's a beginner-friendly guide.

#### What is FastAPI?

FastAPI is a Python web framework (like Flask, but faster and with automatic API documentation). Our ML server uses it to provide AI-powered features.

#### Step 1: Navigate to ML Server Directory

```bash
cd ml-server
```

#### Step 2: Create Virtual Environment

A virtual environment keeps Python packages isolated for this project:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

**You should see `(venv)` in your terminal prompt.**

#### Step 3: Install Dependencies

```bash
# Make sure virtual environment is activated (you should see "venv")
pip install -r requirements.txt
```

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server (runs FastAPI)
- `openai` - OpenAI API client
- `python-dotenv` - Load environment variables
- Other dependencies

**If you get errors:**
- Make sure Python 3.9+ is installed: `python3 --version`
- Make sure virtual environment is activated
- Try: `pip install --upgrade pip` first

#### Step 4: Set Up Environment Variables

Create `.env` file in `ml-server/`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Optional - server works without OpenAI using fallback methods
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server port
PORT=8000
```

**Getting OpenAI API Key (Optional):**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste into `.env`
5. **Note:** The server works without OpenAI, but with reduced functionality

#### Step 5: Run the Server

```bash
# Make sure virtual environment is activated
python app.py
```

Or use uvicorn directly:

```bash
uvicorn app:app --reload --port 8000
```

Server starts at **http://localhost:8000**

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test the server:**
Open in browser: **http://localhost:8000**
- You should see JSON with API information
- Visit **http://localhost:8000/docs** for interactive API documentation (Swagger UI)

#### FastAPI Features You'll See

- **Automatic API Docs:** Visit `http://localhost:8000/docs` to see interactive API documentation
- **Type Validation:** FastAPI automatically validates request/response types
- **CORS:** Already configured to allow requests from Next.js app

#### Common FastAPI Commands

```bash
# Run server (development mode with auto-reload)
uvicorn app:app --reload --port 8000

# Run server (production mode)
uvicorn app:app --host 0.0.0.0 --port 8000

# Check if server is running
curl http://localhost:8000/health
```

---

## 🎯 Running All Servers

You need to run **3 servers simultaneously** in separate terminal windows:

### Terminal 1: Next.js App

```bash
cd /Users/Taj786/projects/labchainx
npm run dev
```

**Status:** ✅ Running on http://localhost:3000

### Terminal 2: Socket.IO Server

```bash
cd /Users/Taj786/projects/labchainx/socket-server
npm start
```

**Status:** ✅ Running on http://localhost:3001

### Terminal 3: ML Server

```bash
cd /Users/Taj786/projects/labchainx/ml-server
source venv/bin/activate  # Activate virtual environment
python app.py
```

**Status:** ✅ Running on http://localhost:8000

### Quick Start Script (Optional)

Create a script to start all servers at once:

**macOS/Linux** - Create `start-all.sh`:

```bash
#!/bin/bash

# Start Next.js (background)
cd /Users/Taj786/projects/labchainx
npm run dev &
NEXT_PID=$!

# Start Socket.IO (background)
cd socket-server
npm start &
SOCKET_PID=$!

# Start ML Server
cd ../ml-server
source venv/bin/activate
python app.py &
ML_PID=$!

echo "All servers started!"
echo "Next.js: http://localhost:3000 (PID: $NEXT_PID)"
echo "Socket.IO: http://localhost:3001 (PID: $SOCKET_PID)"
echo "ML Server: http://localhost:8000 (PID: $ML_PID)"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $NEXT_PID $SOCKET_PID $ML_PID" EXIT
wait
```

Make it executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 🔍 How It All Works Together

### Request Flow

```
User Browser
    │
    ├─→ Next.js App (localhost:3000)
    │       │
    │       ├─→ API Routes (Next.js API)
    │       │       └─→ MongoDB (Database)
    │       │
    │       ├─→ Socket.IO Client
    │       │       └─→ Socket.IO Server (localhost:3001)
    │       │               └─→ Real-time collaboration
    │       │
    │       └─→ ML API Client
    │               └─→ ML Server (localhost:8000)
    │                       └─→ AI features
```

### Example: Creating a Protocol with AI

1. User opens Protocol Builder
2. Types protocol description
3. Clicks "AI Suggest Next Step"
4. Next.js calls ML Server (`/autocomplete`)
5. ML Server uses OpenAI (or fallback) to suggest step
6. Next.js receives suggestion and adds to UI
7. User saves protocol
8. Next.js saves to MongoDB via API route

### Example: Real-time Notebook Collaboration

1. User A opens notebook
2. Next.js connects to Socket.IO server (WebSocket)
3. User A joins notebook "room"
4. User A types content
5. Socket.IO broadcasts to all users in room
6. User B (in same notebook) sees changes instantly
7. Auto-save triggers every 3 seconds
8. Next.js saves to MongoDB

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** "Please define the MONGODB_URI environment variable"

**Solution:**
1. Check `.env.local` exists in root directory
2. Verify `MONGODB_URI` is set correctly
3. Test connection:
   ```bash
   # For local MongoDB
   mongosh mongodb://localhost:27017/labchain
   
   # For Atlas, test connection string
   ```

**Error:** "Mongoose connection error"

**Solution:**
- Check MongoDB is running (local) or cluster is active (Atlas)
- Verify connection string format
- Check firewall/network settings (for Atlas)

### Socket.IO Connection Issues

**Error:** "Socket connection error" in browser console

**Solution:**
1. Verify Socket.IO server is running: `curl http://localhost:3001/health`
2. Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
3. Check `CLIENT_URL` in `socket-server/.env`
4. Verify CORS settings in `socket-server/index.js`

### ML Server Issues

**Error:** "ML Server is not available"

**Solution:**
1. Check ML server is running: `curl http://localhost:8000/health`
2. Verify `NEXT_PUBLIC_ML_SERVER_URL` in `.env.local`
3. Check Python virtual environment is activated
4. Verify FastAPI dependencies are installed:
   ```bash
   cd ml-server
   source venv/bin/activate
   pip list  # Should show fastapi, uvicorn, etc.
   ```

**Error:** "ModuleNotFoundError" in Python

**Solution:**
1. Make sure virtual environment is activated
2. Reinstall dependencies:
   ```bash
   cd ml-server
   source venv/bin/activate
   pip install -r requirements.txt
   ```

**Error:** OpenAI API errors

**Solution:**
- Server works without OpenAI (uses fallback methods)
- Check API key is valid (if using OpenAI)
- Verify billing/credits on OpenAI account

### Port Already in Use

**Error:** "Port 3000 already in use"

**Solution:**
```bash
# Find process using port
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3002 npm run dev
```

### NextAuth Errors

**Error:** "NEXTAUTH_SECRET is not set"

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local`: `NEXTAUTH_SECRET=your-generated-secret`
3. Restart Next.js server

---

## 📚 Learning Resources

### FastAPI (for ML Server)

- **Official Docs:** https://fastapi.tiangolo.com/
- **Tutorial:** https://fastapi.tiangolo.com/tutorial/
- **Key Concepts:**
  - Routes: Define endpoints (like `/standardize`)
  - Models: Pydantic models for request/response validation
  - Dependencies: Reusable components (like database connections)

### Socket.IO

- **Official Docs:** https://socket.io/docs/v4/
- **Concepts:**
  - Rooms: Group connections (one room per notebook)
  - Events: Custom messages (like `content-change`)
  - Middleware: Authentication before connection

### Next.js

- **Official Docs:** https://nextjs.org/docs
- **App Router:** Our project uses the new App Router structure

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] MongoDB is running/accessible
- [ ] Next.js app starts without errors
- [ ] Socket.IO server starts and shows "running on port 3001"
- [ ] ML server starts and shows Uvicorn running message
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:8000/docs (FastAPI docs)
- [ ] Can sign up/create account
- [ ] Can create a notebook
- [ ] Can create a protocol
- [ ] Socket.IO connection works (check browser console)
- [ ] ML server responds (check browser console for autocomplete)

---

## 🎓 Next Steps

1. **Explore the UI:** Try creating notebooks, protocols, and replications
2. **Test Real-time:** Open same notebook in two browser windows
3. **Try AI Features:** Use autocomplete in protocol builder (if ML server has OpenAI)
4. **Read the Code:** Check out the API routes, models, and components
5. **Customize:** Modify themes, add features, experiment!

---

## 🆘 Need Help?

- Check browser console for errors
- Check terminal output for server errors
- Verify all environment variables are set
- Ensure all three servers are running
- Review this guide's troubleshooting section

Happy coding! 🚀

