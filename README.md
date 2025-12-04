# LabChain

A scientific reproducibility and collaboration platform for building, sharing, and verifying experiments with transparency and trust.

## 🚀 Features

- **Real-time Collaborative Lab Notebooks** - Live synchronization with Socket.IO, voice-to-text transcription, and auto-save
- **Protocol Builder** - Drag-and-drop protocol creation with versioning and structured steps
- **ML-Powered Assistance** - AI autocomplete and protocol standardization via ML server
- **Replication Tracking** - Track experiment replications with cryptographic verification
- **Institution Verification** - Cryptographic signing for result integrity
- **User Authentication** - Secure authentication with NextAuth.js and MongoDB

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Vercel)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App Router │  │  Components  │  │   Zustand    │      │
│  │   (Pages)    │  │   (UI/UX)    │  │   (State)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Next.js API Routes (Serverless)             │  │
│  │  - Authentication (NextAuth.js)                       │  │
│  │  - Notebooks CRUD                                     │  │
│  │  - Protocols CRUD                                     │  │
│  │  - Replications CRUD                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────┐
                            │                 │
                            ▼                 ▼
        ┌──────────────────────────┐  ┌──────────────────────┐
        │   MongoDB (Atlas/Cloud)  │  │  Socket.IO Server    │
        │  - Users                 │  │  (Render/Fly.io)     │
        │  - Notebooks             │  │  - Real-time sync    │
        │  - Protocols             │  │  - Room management   │
        │  - Replications          │  │  - JWT auth          │
        └──────────────────────────┘  └──────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │      ML Server (FastAPI)              │
        │  (Render/Fly.io/Heroku)              │
        │  - Protocol standardization          │
        │  - AI autocomplete                   │
        │  - Missing parameter detection        │
        │  - OpenAI/HuggingFace integration     │
        └──────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router) with TypeScript
- **TailwindCSS** - Minimal scientific theme
- **Zustand** - State management
- **Socket.IO Client** - Real-time collaboration
- **shadcn/ui** - UI components
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js v4** - Authentication
- **MongoDB + Mongoose** - Database
- **Socket.IO Server** - Real-time WebSocket server
- **FastAPI (Python)** - ML services

### Security & Verification
- **ECDSA** - Cryptographic signing
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing

## 📦 Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── notebook/          # Lab notebook pages
│   ├── protocols/         # Protocol builder pages
│   └── replications/      # Replication tracking
├── components/            # React components
│   ├── layout/           # Sidebar, Topbar
│   ├── protocol/         # Protocol-specific components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # MongoDB connection
│   ├── crypto.ts         # Cryptographic utilities
│   └── ml-api.ts         # ML server client
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Notebook.ts
│   ├── Protocol.ts
│   └── Replication.ts
├── stores/                # Zustand stores
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── socket-server/         # Socket.IO server (Node.js)
│   └── index.js
└── ml-server/             # ML server (Python/FastAPI)
    └── app.py
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for ML server)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd labchainx
   ```

2. **Install Next.js dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/labchain
   NEXTAUTH_SECRET=your-secret-key-min-32-characters
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NEXT_PUBLIC_ML_SERVER_URL=http://localhost:8000
   ```

4. **Set up Socket.IO server**
   ```bash
   cd socket-server
   npm install
   # Create .env with:
   # CLIENT_URL=http://localhost:3000
   # JWT_SECRET=your-secret-key
   # PORT=3001
   npm start
   ```

5. **Set up ML server**
   ```bash
   cd ml-server
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   # Create .env with:
   # OPENAI_API_KEY=your-openai-key (optional)
   # PORT=8000
   python app.py
   ```

6. **Run Next.js development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Authentication

LabChain uses NextAuth.js with:
- **Credentials Provider** - Email/password authentication
- **MongoDB User Model** - User data storage
- **JWT Sessions** - Secure session management
- **Protected Routes** - Middleware-based route protection

## 🔄 Real-time Collaboration

- **Socket.IO Server** - Separate Node.js server for WebSocket connections
- **Room-based** - Each notebook has its own room
- **JWT Authentication** - Secure socket connections
- **Live Updates** - Real-time content synchronization

## 🤖 ML Services

The ML server provides:
- **Protocol Standardization** - Convert free text to structured protocols
- **AI Autocomplete** - Suggest next protocol steps
- **Missing Parameter Detection** - Identify incomplete protocol steps

## 🔒 Cryptographic Verification

- **ECDSA Signing** - Elliptic curve digital signatures
- **Data Integrity** - Hash-based verification
- **Institution Signing** - Multi-party verification support

## 📊 Database Models

- **User** - User accounts with institution and role
- **Notebook** - Lab notebooks with version history
- **Protocol** - Experimental protocols with steps and versions
- **Replication** - Experiment replications with verification

## 🚢 Deployment

### Next.js App (Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Socket.IO Server (Render/Fly.io)
1. Deploy `socket-server/` directory
2. Set environment variables
3. Ensure port is accessible

### ML Server (Render/Fly.io/Heroku)
1. Deploy `ml-server/` directory
2. Install Python dependencies
3. Set environment variables (OPENAI_API_KEY)

### MongoDB
- Use MongoDB Atlas for production
- Update `MONGODB_URI` in environment variables

## 📄 License

This project is part of the LabChain platform.

## 🤝 Contributing

This is a development project. Contributions and feedback are welcome!

---

Built with ❤️ for scientific reproducibility and collaboration.
