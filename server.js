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

    console.log("User disconnected:", socket.id);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("🚀 Socket.IO running on port", PORT);
});
