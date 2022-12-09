const VisioVideo = ({ stream, name, audio, video, userRef, isLocal = false }) => {
    const containerStyle = isLocal ?
        'absolute top-0 right-0 m-2 w-44 h-36 rounded-sm z-1 sm:h-66 sm:w-66 sm:m-4'
        : 'flex flex-grow items-start'

    const updateOtherVideoRef = (ref) => {
        if (userRef.current && userRef.current.srcObject)
            return

        userRef.current = ref

        if (userRef.current)
            userRef.current.srcObject = stream
    }
            
    return (
        <div className={containerStyle}>
            <video
                ref={ref => updateOtherVideoRef(ref)}
                id="local-video"
                autoPlay={true}
                muted={isLocal ? isLocal : audio}
                className={'w-full h-full object-cover rounded-xl z-10'}
            />

            <div className={`absolute ${isLocal ? 'bottom-1' : 'top-1' } left-1 m-1`}>
                {name &&
                    <p className="text-lg text-white font-bold bg-rtc-black rounded-xl px-2 py-1 sm:text-sm">
                        {name}
                    </p>
                } 
            </div>
        </div>
    )
}

export default VisioVideo