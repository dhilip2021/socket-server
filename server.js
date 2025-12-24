const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

app.use(express.json())

// health check (Render ku useful)
app.get('/', (req, res) => {
  res.send('Socket server running ✅')
})

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', socket => {
  console.log('User connected:', socket.id)

  socket.on('join-team', teamId => {
    socket.join(teamId)
    console.log(`Joined team: ${teamId}`)
  })

  socket.on('team-message', data => {
    io.to(data.teamId).emit('team-message', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log('🚀 Socket.IO running on port', PORT)
})
