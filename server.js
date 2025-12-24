const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*' }
})

io.on('connection', socket => {
  console.log('User connected:', socket.id)

  socket.on('join-team', teamId => {
    socket.join(teamId)
  })

  socket.on('team-message', data => {
    io.to(data.teamId).emit('team-message', data)
  })
})

server.listen(3001, () => {
  console.log('Socket running on http://localhost:3001')
})
