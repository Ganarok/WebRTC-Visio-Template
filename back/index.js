const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server)
const cors = require('cors')
const ioRooms = io.of('/')
const PORT = 3000

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`SocketIO server listening on port ${PORT}`)
})

ioRooms.on('connection', (socket) => {
    console.log('User connected')

    socket.on('join', (payload) => {
        const roomId = payload.room
        const clientsNumber = ioRooms.adapter.rooms && ioRooms.adapter.rooms.has(roomId) ? ioRooms.adapter.rooms.get(roomId).size : 0

        if (clientsNumber === 0) {
            console.log(`Creating room ${roomId} and emitting room_created socket event`)

            socket.join(roomId)
            socket.emit('room_created', {
                roomId,
                peerId: socket.id,
            })
        } else {
            console.log(`Joining room ${roomId} and emitting room_joined socket event`)
            socket.join(roomId)
            socket.emit('room_joined', {
                roomId,
                peerId: socket.id,
            })
        } 
    })

    socket.on('start_call', (event) => {
        console.log(`Broadcasting start_call event to peers in room ${event.roomId} from peer ${event.senderId}`)

        socket.broadcast.to(event.roomId).emit('start_call', {
            senderId: event.senderId,
            name: event.name || ''
        })
    })

    // Events emitted to only one peer
    socket.on('webrtc_offer', (event) => {
        console.log(`Sending webrtc_offer event to peers in room ${event.roomId} from peer ${event.senderId} to peer ${event.receiverId}`)
        socket.broadcast.to(event.receiverId).emit('webrtc_offer', {
            sdp: event.sdp,
            senderId: event.senderId,
            name: event.name || ''
        })
    })

    socket.on('webrtc_answer', (event) => {
        console.log(`Sending webrtc_answer event to peers in room ${event.roomId} from peer ${event.senderId} to peer ${event.receiverId}`)
        socket.broadcast.to(event.receiverId).emit('webrtc_answer', {
            sdp: event.sdp,
            senderId: event.senderId
        })
    })

    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Sending webrtc_ice_candidate event to peers in room ${event.roomId} from peer ${event.senderId} to peer ${event.receiverId}`)
        socket.broadcast.to(event.receiverId).emit('webrtc_ice_candidate', event)
    })

    socket.on('toggle_mic', (event) => {
        console.log(`Broadcasting toggle_mic event to peers in room ${event.roomId} from peer ${event.senderId}`)
        socket.broadcast.to(event.roomId).emit('toggle_mic', event)
    })

    socket.on('toggle_cam', (event) => {
        console.log(`Broadcasting toggle_cam event to peers in room ${event.roomId} from peer ${event.senderId}`)
        socket.broadcast.to(event.roomId).emit('toggle_cam', event)
    })

    socket.on('leaving_room', (event) => {
        console.log(`Broadcasting leaving_room event to peers in room ${event.roomId} from peer ${event.senderId}`)
        socket.broadcast.to(event.roomId).emit('leaving_room', event)
    })
})
