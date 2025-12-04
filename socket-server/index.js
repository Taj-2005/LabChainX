const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const io = new Server({
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "your-secret-key";

// Store active rooms and their users
const rooms = new Map();

// Authenticate socket connection via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.sub;
    socket.userName = decoded.name || "Anonymous";
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join notebook room
  socket.on("join-notebook", (notebookId) => {
    socket.join(notebookId);
    
    // Track room membership
    if (!rooms.has(notebookId)) {
      rooms.set(notebookId, new Set());
    }
    rooms.get(notebookId).add({
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id,
    });

    // Notify others in the room
    socket.to(notebookId).emit("user-joined", {
      userId: socket.userId,
      userName: socket.userName,
    });

    // Send current room members to the new user
    const members = Array.from(rooms.get(notebookId) || []);
    socket.emit("room-members", members);

    console.log(`User ${socket.userId} joined notebook ${notebookId}`);
  });

  // Handle content changes
  socket.on("content-change", (data) => {
    const { notebookId, content, userId } = data;
    
    // Broadcast to all others in the room
    socket.to(notebookId).emit("content-updated", {
      content,
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle cursor/selection changes
  socket.on("cursor-change", (data) => {
    const { notebookId, cursor, userId } = data;
    
    socket.to(notebookId).emit("cursor-updated", {
      cursor,
      userId,
      userName: socket.userName,
    });
  });

  // Handle voice transcription
  socket.on("voice-transcription", (data) => {
    const { notebookId, text, userId } = data;
    
    socket.to(notebookId).emit("voice-transcription-updated", {
      text,
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave notebook room
  socket.on("leave-notebook", (notebookId) => {
    socket.leave(notebookId);
    
    if (rooms.has(notebookId)) {
      const room = rooms.get(notebookId);
      room.forEach((member) => {
        if (member.socketId === socket.id) {
          room.delete(member);
        }
      });
      
      if (room.size === 0) {
        rooms.delete(notebookId);
      }
    }

    socket.to(notebookId).emit("user-left", {
      userId: socket.userId,
      userName: socket.userName,
    });

    console.log(`User ${socket.userId} left notebook ${notebookId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove user from all rooms
    rooms.forEach((members, notebookId) => {
      members.forEach((member) => {
        if (member.socketId === socket.id) {
          members.delete(member);
          socket.to(notebookId).emit("user-left", {
            userId: socket.userId,
            userName: socket.userName,
          });
        }
      });
      
      if (members.size === 0) {
        rooms.delete(notebookId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
io.listen(PORT);
console.log(`Socket.IO server running on port ${PORT}`);

