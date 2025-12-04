# 🚀 LabChain Quick Start

Quick reference for running all servers. See [SETUP.md](./SETUP.md) for detailed instructions.

## One-Time Setup

```bash
# 1. Install Next.js dependencies
npm install

# 2. Install Socket.IO server dependencies
cd socket-server && npm install && cd ..

# 3. Set up ML server (Python virtual environment)
cd ml-server
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Create environment files
cp .env.example .env.local
cp socket-server/.env.example socket-server/.env
cp ml-server/.env.example ml-server/.env

# 5. Edit .env files with your values (see SETUP.md)
```

## Running All Servers (Every Time)

You need **3 terminal windows** open:

### Terminal 1: Next.js App
```bash
npm run dev
```
✅ Running at: http://localhost:3000

### Terminal 2: Socket.IO Server
```bash
cd socket-server
npm start
```
✅ Running at: http://localhost:3001

### Terminal 3: ML Server
```bash
cd ml-server
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```
✅ Running at: http://localhost:8000

## Quick Checks

- ✅ Next.js: Open http://localhost:3000
- ✅ Socket.IO: Check terminal for "Socket.IO server running on port 3001"
- ✅ ML Server: Open http://localhost:8000/health

## Common Commands

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Check MongoDB connection (if local)
mongosh mongodb://localhost:27017/labchain

# Check if ports are in use
lsof -ti:3000  # Next.js
lsof -ti:3001  # Socket.IO
lsof -ti:8000  # ML Server
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `kill -9 $(lsof -ti:PORT)` |
| MongoDB connection error | Check `.env.local` has correct `MONGODB_URI` |
| Socket.IO not connecting | Verify `NEXT_PUBLIC_SOCKET_URL` in `.env.local` |
| ML server not working | Check Python venv is activated and dependencies installed |
| ModuleNotFoundError | Activate venv: `source ml-server/venv/bin/activate` |

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

