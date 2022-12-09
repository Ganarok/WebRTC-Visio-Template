import { withRouter } from "next/router"
import React, { PureComponent } from "react"
import { io } from "socket.io-client"

import Loader from "@/components/Loader"
import VisioVideo from "@/components/VisioVideo"

const socket = io('http://localhost:3000/rooms')
const ROOM_STATUS = {
    JOINING: 0,
    WAITING: 1,
    IN_CALL: 2,
    LEAVED: 3
}

// STUN servers if communicating through WIFI, TURN servers if someone is communicating through LTE Network (4G)
const iceServers = {
    iceServers: [
        {
            urls: 'stun:stun1.l.google.com:19302',
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ]
}

let peerConnections = {}

export default withRouter(class Room extends PureComponent {
    constructor(props) {
        super(props)

        this.localRef = React.createRef()
        this.othersRef = {}

        this.state = {
            localName: '',
            localPeerId: null,
            localStream: null,
            videoInputs: [],
            roomId: '',
            callStatus: ROOM_STATUS.JOINING,
            selfVideo: true,
            selfAudio: true,
            remoteStreams: [],
            reason: ''
        }
    }

    async componentDidMount() {
        const { selfAudio, selfVideo } = this.state

        this.initSocketIo()

        const isLocalStreamDefined = await this.setLocalStream({ audio: selfAudio, video: selfVideo })

        if (!isLocalStreamDefined) {
            this.setState({
                callStatus: ROOM_STATUS.LEAVED
            })
            this.clearConnection()
        } else
            this.joinRoom()
    }

    componentWillUnmount() {
        this.clearConnection()
    }

    initSocketIo() {
        socket.on('connect_error', () => {
            const { callStatus } = this.state

            console.log('Connection failure')

            if (callStatus !== ROOM_STATUS.LEAVED) {
                this.setState({
                    callStatus: ROOM_STATUS.LEAVED,
                    reason: 'Connection failure'
                })
            }

            this.clearConnection()
        })

        socket.on('room_joined', (notif) => {
            const { roomId } = this.state 

            console.log('Socket callback : room_joined');
            this.setState({
                callStatus: ROOM_STATUS.WAITING,
                localPeerId: notif.peerId,
                roomId
            })

            socket.emit('start_call', {
                roomId,
                senderId: notif.peerId,
                name: this.state.localName
            })
        })

        socket.on('start_call', async (notif) => {
            const { name: remotePeerName, senderId: remotePeerId } = notif

            if (!remotePeerId)
                return

            peerConnections[remotePeerId] = new RTCPeerConnection(iceServers)
            this.addLocalTracks(peerConnections[remotePeerId])
            peerConnections[remotePeerId].onaddstream = (e) => peerConnections[remotePeerId].addStream(e.stream)
            peerConnections[remotePeerId].ontrack = (e) => this.setRemoteStream(e, remotePeerId, remotePeerName)
            peerConnections[remotePeerId].oniceconnectionstatechange = (e) => this.checkPeerDisconnect(e, remotePeerId)
            peerConnections[remotePeerId].onicecandidate = (e) => this.sendIceCandidate(e, remotePeerId)

            await this.createOffer(peerConnections[remotePeerId], remotePeerId)
        })

        socket.on('webrtc_offer', async (notif) => {
            const { name: remotePeerName, senderId: remotePeerId } = notif

            if (!remotePeerId)
                return

            console.log('Socket notif callback: webrtc_offer', notif)

            peerConnections[remotePeerId] = new RTCPeerConnection(iceServers)
            peerConnections[remotePeerId].setRemoteDescription(new RTCSessionDescription(notif.sdp))

            this.addLocalTracks(peerConnections[remotePeerId])

            peerConnections[remotePeerId].onaddstream = (e) => peerConnections[remotePeerId].addStream(e.stream)
            peerConnections[remotePeerId].ontrack = (e) => this.setRemoteStream(e, remotePeerId, remotePeerName)
            peerConnections[remotePeerId].oniceconnectionstatechange = (e) => this.checkPeerDisconnect(e, remotePeerId)
            peerConnections[remotePeerId].onicecandidate = (e) => this.sendIceCandidate(e, remotePeerId)

            await this.createAnswer(peerConnections[remotePeerId], remotePeerId)
        })

        socket.on('webrtc_answer', async (event) => {
            if (!event.senderId)
                return

            console.log('Socket event callback: webrtc_answer')

            peerConnections[event.senderId].setRemoteDescription(new RTCSessionDescription(event.sdp))
            console.log('Remote description set')
            this.addLocalTracks(peerConnections[event.senderId])
        })

        socket.on('webrtc_ice_candidate', (event) => {
            if (!event.senderId)
                return

            console.log('Socket event callback: webrtc_ice_candidate')

            const parsedCandidate = JSON.parse(event.candidate)
            var candidate = new RTCIceCandidate(parsedCandidate)

            peerConnections[event.senderId].addIceCandidate(candidate)
        })

        socket.on('leaving_room', (event) => {
            console.log('Socket event callback: leaving_room')

            this.clearRemoteConnection(event.senderId)

            if (Object.keys(peerConnections).length < 1)
                this.setState({ callStatus: ROOM_STATUS.WAITING })
        })

        socket.on('disconnect', (reason) => {
            console.log('Disconnected', reason)
            this.clearConnection()
            this.setState({
                callStatus: ROOM_STATUS.LEAVED,
                reason
            })
        })
    }

    /**
    * Handles ICE Connection state change event
    */
    checkPeerDisconnect(event, remotePeerId) {
        const state = peerConnections[remotePeerId].iceConnectionState

        if (state === "failed" || state === "closed" || state === "disconnected") {
            console.log(`Peer ${remotePeerId} has disconnected`)

            this.clearRemoteConnection(remotePeerId)
        }
    }

    joinRoom() {
        const { name, id } = this.props.router.query
        
        if (!id)
            return
        
        console.log('Emitting join with id', id, socket)
        socket.emit('join', { roomId: id })
        
        this.setState({
            localName: name,
            roomId: id
        })
    }

    async setLocalStream(mediaConstraints) {
        try {
            const videoInputs = (await navigator.mediaDevices.enumerateDevices()).filter(input => input.kind === 'videoinput')
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    
            this.setState({
                localStream: stream,
                videoInputs
            })
            console.log('Local stream set')
        } catch (error) {
            console.error('Could not get user media', error)
            alert("Impossible d'accéder au micro ou à la caméra. Veuillez vérifier les autorisations accordées à votre navigateur.")

            return false
        }

        return true
    }

    /**
     * Callback when the peer share his multimedia stream
     */
    setRemoteStream(event, remotePeerId, remotePeerName) {
        const { remoteStreams } = this.state

        if (event.track.kind === "video" && (remoteStreams.findIndex(stream => stream.remotePeerId === remotePeerId)) === -1) {
            this.othersRef[remotePeerId] = React.createRef()

            this.setState({
                remoteStreams: [
                    ...remoteStreams,
                    {
                        stream: event.streams[0],
                        video: true,
                        audio: true,
                        name: remotePeerName,
                        remotePeerId
                    }
                ]
            }, () => {
                if (this.othersRef[remotePeerId] && this.othersRef[remotePeerId].current)
                    this.othersRef[remotePeerId].current.srcObject = event.streams[0]
            })

            this.setState({
                callStatus: ROOM_STATUS.IN_CALL
            })
        }
    }

    addLocalTracks(rtcPeerConnection) {
        const { localStream } = this.state

        localStream.getTracks().forEach((track) => {
            rtcPeerConnection.addTrack(track, localStream)
        })
    }

    /**
    * Sends an ICE Candidate to peer to add to his RTCPeerConnection
    */
    sendIceCandidate(event, remotePeerId) {
        if (event.candidate) {
            const { localPeerId, roomId } = this.state
            
            console.log(`Sending ICE Candidate`)

            socket.emit('webrtc_ice_candidate', {
                senderId: localPeerId,
                receiverId: remotePeerId,
                roomId: roomId,
                label: event.candidate.sdpMLineIndex,
                candidate: JSON.stringify(event.candidate),
            })
        }
    }

    /**
     * Creates the offer with the sdp (Session Description) & send it through webrtc_offer socket notification
     */
    async createOffer(rtcPeerConnection, remotePeerId) {
        const { localName, selfAudio, selfVideo, roomId, localPeerId } = this.state

        try {
            const sessionDescription = await rtcPeerConnection.createOffer({
                offerToReceiveAudio: selfAudio,
                offerToReceiveVideo: selfVideo
            })
            rtcPeerConnection.setLocalDescription(sessionDescription)

            console.log('Sending offer')

            socket.emit('webrtc_offer', {
                type: 'webrtc_offer',
                sdp: sessionDescription,
                roomId: roomId,
                senderId: localPeerId,
                name: localName,
                receiverId: remotePeerId
            })
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Creates the answer with the sdp (Session Description) & send it through webrtc_answer socket notification
     */
    async createAnswer(rtcPeerConnection, remotePeerId) {
        const { roomId, localPeerId, selfAudio, selfVideo } = this.state

        try {
            const sessionDescription = await rtcPeerConnection.createAnswer({
                offerToReceiveAudio: selfAudio,
                offerToReceiveVideo: selfVideo
            })
            rtcPeerConnection.setLocalDescription(sessionDescription)

            console.log('Sending answer')

            socket.emit('webrtc_answer', {
                type: 'webrtc_answer',
                sdp: sessionDescription,
                roomId: roomId,
                senderId: localPeerId,
                receiverId: remotePeerId
            })
        } catch (error) {
            console.error(error)
        }
    }

    clearRemoteConnection(remotePeerId) {
        const { remoteStreams } = this.state

        if (!remotePeerId)
            return

        if (peerConnections[remotePeerId]) {
            peerConnections[remotePeerId]?.close()
            delete peerConnections[remotePeerId]
        }

        const streamIndex = remoteStreams.findIndex(remoteStream => remoteStream.remotePeerId === remotePeerId)

        if (streamIndex !== -1) {
            if (remoteStreams[streamIndex]) {
                console.log(`Releasing ${remotePeerId}'s stream`)
                remoteStreams[streamIndex].stream.getVideoTracks()[0].stop()
            }
        } else {
            console.log('Could not find the remote stream to clean')
        }

        this.setState({
            remoteStreams: remoteStreams.filter(remoteStream => remoteStream.remotePeerId !== remotePeerId)
        })
    }

    clearConnection() {
        const { localStream } = this.state

        if (localStream)
            localStream.getTracks().forEach(track => track.stop())

        socket.close()
    }

    renderInCall() {
        const { localName, localStream, selfAudio, selfVideo, remoteStreams } = this.state

        return (
            <>
                <VisioVideo
                    userRef={this.localRef}
                    name={localName}
                    stream={localStream}
                    audio={selfAudio}
                    video={selfVideo}
                    isLocal={true}
                />

                {remoteStreams.length ? 
                    <div className="flex flex-grow relative h-full w-full object-center items-center justify-center bg-black">
                        {remoteStreams.map((remoteStream, index) => 
                            <VisioVideo
                                userRef={this.othersRef[remoteStream.remotePeerId]}
                                key={index}
                                stream={remoteStream.stream}
                                audio={remoteStream.audio}
                                video={remoteStream.video}
                                name={remoteStream.name}
                            />
                        )}
                    </div>
                : null }
            </>
        )
    }

    renderCallState() {
        const { callStatus } = this.state

        switch (callStatus) {
            case ROOM_STATUS.JOINING:
                return (
                    <Loader />
                )

            case ROOM_STATUS.WAITING:
                return (
                    <div>
                        Waiting ...
                    </div>
                )
                    
            case ROOM_STATUS.IN_CALL:
                return this.renderInCall()
                    
            case ROOM_STATUS.LEAVED:
                return (
                    <div>
                        You leaved the room
                    </div>
                )
        
            default:
                break;
        }
    }

    render() {
        const { callStatus } = this.state

        console.log(callStatus);

        return (
            <div className="flex h-screen w-full items-center justify-center">
                { this.renderCallState() }
            </div>
        )
    }
})