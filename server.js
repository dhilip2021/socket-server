const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Socket server running ✅");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🔥 TEAM-WISE ONLINE USERS
const onlineUsers = {};
// {
//   teamId: { userName: socketId }
// }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ USER ONLINE
  socket.on("user-online", ({ userName, teamId }) => {
    socket.userName = userName;
    socket.teamId = teamId;

    if (!onlineUsers[teamId]) {
      onlineUsers[teamId] = {};
    }

    onlineUsers[teamId][userName] = socket.id;

    socket.join(teamId);

    // 🔥 send only that team's online users
    io.to(teamId).emit("online-users", Object.keys(onlineUsers[teamId]));

    console.log(`🟢 ${userName} online in ${teamId}`);
  });

  // ✅ TEAM MESSAGE
  socket.on("team-message", (data) => {
    io.to(data.teamId).emit("team-message", data);
  });

  // ✅ USER OFFLINE
  socket.on("disconnect", () => {
    const { userName, teamId } = socket;

    if (userName && teamId && onlineUsers[teamId]) {
      delete onlineUsers[teamId][userName];

      io.to(teamId).emit("online-users", Object.keys(onlineUsers[teamId]));

      console.log(`🔴 ${userName} offline from ${teamId}`);
    }
    socket.broadcast.emit('user-left', socket.id)
    console.log("User disconnected:", socket.id);
  });
 
 

  socket.on('join-room', roomId => {
    socket.join(roomId)

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
    socket.emit('existing-users', clients.filter(id => id !== socket.id))

    socket.to(roomId).emit('user-joined', socket.id)
  })

  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', {
      from: socket.id,
      offer
    })
  })

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', {
      from: socket.id,
      answer
    })
  })

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate
    })
  })

 
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("🚀 Socket.IO running on port", PORT);
});
