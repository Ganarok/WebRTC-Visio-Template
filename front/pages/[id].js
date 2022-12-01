import { withRouter } from "next/router"
import { PureComponent } from "react"

import Loader from "@/components/Loader"
import VisioVideo from "@/components/VisioVideo"

const ROOM_STATUS = {
    JOINING: 0,
    JOINED: 1,
    WAITING: 2,
    IN_CALL: 3,
    LEAVED: 4
}

// STUN servers if communicating though WIFI, TURN servers if someone is communicating though LTE Network (4G)
const iceServers = {
    iceServers: [
        {
            urls: 'stun.l.google.com:19302',
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

export default withRouter(class Room extends PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            localName: '',
            roomId: '',
            callStatus: ROOM_STATUS.JOINED,
            selfVideo: true,
            selfAudio: true
        }
    }

    async componentDidMount() {
        const { selfAudio, selfVideo } = this.state

        // this.initSocketIo()

        const isLocalStreamDefined = await this.setLocalStream({ audio: selfAudio, video: selfVideo })

        if (!isLocalStreamDefined)
            console.log('HangUp')
        else
            this.joinRoom()

    }

    componentWillUnmount() {

    }

    async joinRoom() {
        const { name, id } = this.props.router.query

        if (!id)
            return

        // socket.emit('join')
        
        this.setState({
            localName: name,
            id
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

    renderCallState() {
        const { callStatus, localName, localStream, selfAudio, selfVideo } = this.state

        switch (callStatus) {
            case ROOM_STATUS.JOINING:
                return (
                    <Loader />
                )

            case ROOM_STATUS.JOINED:
                return (
                    <VisioVideo
                        name={localName}
                        stream={localStream}
                        audio={selfAudio}
                        video={selfVideo}
                        isLocal={true}
                    />
                )
        
            default:
                break;
        }
    }

    render() {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                { this.renderCallState() }
            </div>
        )
    }
})