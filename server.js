const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Socket server running ✅");
});

const rooms = {}

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

// 🔒 PRIVATE MESSAGE
socket.on("private-message", ({ teamId, from, to, text, time }) => {
  if (!onlineUsers[teamId]) return

  const toSocketId = onlineUsers[teamId][to]
  const fromSocketId = onlineUsers[teamId][from]

  const payload = {
    from,
    to,
    text,
    time,
    private: true
  }

  // send to receiver
  if (toSocketId) {
    io.to(toSocketId).emit("private-message", payload)
  }

  // send back to sender (so sender can see his own msg)
  if (fromSocketId) {
    io.to(fromSocketId).emit("private-message", payload)
  }
})


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
 
 

  // socket.on('join-room', roomId => {
  //   socket.join(roomId)

  //   const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
  //   socket.emit('existing-users', clients.filter(id => id !== socket.id))

  //   socket.to(roomId).emit('user-joined', socket.id)
  // })



  // socket.on('offer', ({ to, offer }) => {
  //   io.to(to).emit('offer', {
  //     from: socket.id,
  //     offer
  //   })
  // })

  // socket.on('answer', ({ to, answer }) => {
  //   io.to(to).emit('answer', {
  //     from: socket.id,
  //     answer
  //   })
  // })

  // socket.on('ice-candidate', ({ to, candidate }) => {
  //   io.to(to).emit('ice-candidate', {
  //     from: socket.id,
  //     candidate
  //   })
  // })

socket.on('join-room', roomId => {
    socket.join(roomId)

    if (!rooms[roomId]) rooms[roomId] = []
    rooms[roomId].push(socket.id)

    const others = rooms[roomId].filter(id => id !== socket.id)

    socket.emit('existing-users', others)
    socket.to(roomId).emit('user-joined', socket.id)

    socket.on('offer', data => {
      io.to(data.to).emit('offer', {
        from: socket.id,
        offer: data.offer
      })
    })

    socket.on('answer', data => {
      io.to(data.to).emit('answer', {
        from: socket.id,
        answer: data.answer
      })
    })

    socket.on('ice-candidate', data => {
      io.to(data.to).emit('ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      })
    })

    socket.on('disconnect', () => {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id)
      socket.to(roomId).emit('user-left', socket.id)

      if (rooms[roomId].length === 0) delete rooms[roomId]
    })
  })

});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("🚀 Socket.IO running on port", PORT);
});
