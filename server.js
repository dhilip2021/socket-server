const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Socket server running ✅')
})

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// team-wise online users
// {
//   teamId: { userName: socketId }
// }
const onlineUsers = {}

io.on('connection', socket => {
  console.log('User connected:', socket.id)

  // ================= USER ONLINE =================
  socket.on('user-online', ({ userName, teamId }) => {
    socket.userName = userName
    socket.teamId = teamId

    if (!onlineUsers[teamId]) {
      onlineUsers[teamId] = {}
    }

    onlineUsers[teamId][userName] = socket.id

    socket.join(teamId)

    io.to(teamId).emit(
      'online-users',
      Object.keys(onlineUsers[teamId])
    )

    console.log(`🟢 ${userName} online in ${teamId}`)
  })

  // ================= TEAM MESSAGE =================
  socket.on('team-message', data => {
    io.to(data.teamId).emit('team-message', data)
  })

  // ================= PRIVATE CHAT =================
  socket.on('join-private', ({ from, to }) => {
    const roomId = [from, to].sort().join('|')
    socket.join(roomId)

    console.log(`🔐 Private room joined: ${roomId}`)
  })

  socket.on('private-message', data => {
    const roomId = [data.from, data.to].sort().join('|')

    io.to(roomId).emit('private-message', data)

    console.log(
      `💬 Private message ${data.from} ➜ ${data.to}`
    )
  })

  // ================= DISCONNECT =================
  socket.on('disconnect', () => {
    const { userName, teamId } = socket

    if (userName && teamId && onlineUsers[teamId]) {
      delete onlineUsers[teamId][userName]

      io.to(teamId).emit(
        'online-users',
        Object.keys(onlineUsers[teamId])
      )

      console.log(`🔴 ${userName} offline from ${teamId}`)
    }

    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log('🚀 Socket.IO running on port', PORT)
})
