import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { Server } from 'socket.io'

const app = express()
app.use(cors())

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
})
const ioRooms = io.of('/rooms')
const PORT = 3000
const HOST = process.env.HOST || "localhost"

server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`)

    ioRooms.on('connection', (socket) => {
        console.log('User connected')
    
        socket.on('join', (payload) => {
            const { roomId } = payload
    
            console.log(`Joining room ${roomId}`)
            socket.join(roomId)
            socket.emit('room_joined', {
                peerId: socket.id,
            })
        })
    
        socket.on('start_call', (event) => {
            console.log(`Broadcasting start_call event to peers in room ${event.roomId}`)
    
            socket.broadcast.to(event.roomId).emit('start_call', {
                senderId: event.senderId,
                name: event.name || ''
            })
        })
    
        // Events emitted to only one peer
        socket.on('webrtc_offer', (event) => {
            console.log(`Sending webrtc_offer event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.receiverId).emit('webrtc_offer', {
                sdp: event.sdp,
                senderId: event.senderId,
                name: event.name || ''
            })
        })
    
        socket.on('webrtc_answer', (event) => {
            console.log(`Sending webrtc_answer event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.receiverId).emit('webrtc_answer', {
                sdp: event.sdp,
                senderId: event.senderId
            })
        })
    
        socket.on('webrtc_ice_candidate', (event) => {
            console.log(`Sending webrtc_ice_candidate event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.receiverId).emit('webrtc_ice_candidate', event)
        })
    
        socket.on('toggle_mic', (event) => {
            console.log(`Broadcasting toggle_mic event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('toggle_mic', event)
        })
    
        socket.on('toggle_cam', (event) => {
            console.log(`Broadcasting toggle_cam event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('toggle_cam', event)
        })
    
        socket.on('leaving_room', (event) => {
            console.log(`Broadcasting leaving_room event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('leaving_room', event)
        })
    })
})


export default app