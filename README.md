# LabChain

A scientific reproducibility and collaboration platform for building, sharing, and verifying experiments with transparency and trust.

## 🚀 Features

### Core Features
- **Real-time Collaborative Lab Notebooks** - Live synchronization with Socket.IO, voice-to-text transcription, and auto-save
- **Protocol Builder** - Drag-and-drop protocol creation with versioning and structured steps
- **ML-Powered Assistance** - AI autocomplete and protocol standardization via ML server
- **Replication Tracking** - Track experiment replications with cryptographic verification
- **Institution Verification** - Cryptographic signing for result integrity
- **User Authentication** - Secure authentication with NextAuth.js and MongoDB

### Phase 2 - Collaboration & Visualization
- **Pull Request Workflow** - PR-style collaboration for protocol changes with review, comments, and merge
- **Data Visualization** - Interactive charts (time-series, scatter plots, bar-line combo) with CSV export
- **Verification Network** - Visual network graph showing institutional trust scores and verification lineage
- **Protocol Branching** - Support for multiple protocol branches and version management

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
- **Recharts** - Interactive data visualization
- **vis-network** - Network graph visualization

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
│   ├── Replication.ts
│   ├── PullRequest.ts
│   ├── Verification.ts
│   └── Institution.ts
├── components/
│   ├── pr/                # Pull Request components
│   ├── charts/            # Data visualization components
│   └── verification/       # Verification network components
├── scripts/               # Migration and utility scripts
│   └── migrate-phase2.ts  # Phase 2 database migration
├── stores/                # Zustand stores
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── socket-server/         # Socket.IO server (Node.js)
│   └── index.js
└── ml-server/             # ML server (Python/FastAPI)
    └── app.py
```

## 🚀 Getting Started

### Quick Start

**For detailed setup instructions, user flow, and beginner-friendly guides, see [SETUP.md](./SETUP.md)**

### Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   cd socket-server && npm install && cd ..
   cd ml-server && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local` (Next.js app)
   - Copy `socket-server/.env.example` to `socket-server/.env`
   - Copy `ml-server/.env.example` to `ml-server/.env`
   - Fill in your values (see SETUP.md for details)

3. **Run all servers**
   - Terminal 1: `npm run dev` (Next.js - port 3000)
   - Terminal 2: `cd socket-server && npm start` (Socket.IO - port 3001)
   - Terminal 3: `cd ml-server && source venv/bin/activate && python app.py` (ML Server - port 8000)

Visit: **http://localhost:3000**

📖 **See [SETUP.md](./SETUP.md) for:**
- Complete user flow explanation
- Step-by-step setup guide for beginners
- FastAPI/Flask beginner tutorial
- Troubleshooting guide
- How all servers work together

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
- **Protocol** - Experimental protocols with steps, versions, and branching
- **Replication** - Experiment replications with verification
- **PullRequest** - PR-style protocol change proposals with reviews and comments
- **Verification** - Protocol/experiment verification records
- **Institution** - Institution metadata with trust scores

## 🔄 Database Migrations

### Phase 2 Migration

To add Phase 2 features to an existing database, run:

```bash
npx tsx scripts/migrate-phase2.ts
```

This will:
- Create `pullrequests`, `verifications`, and `institutions` collections
- Add indexes for efficient queries
- Update existing Protocol documents with branching fields (`currentBranch`, `branches`)

**Note:** Make sure your `.env.local` has the correct `MONGODB_URI` before running the migration.

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
