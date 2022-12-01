
const VisioVideo = ({ stream, name, audio, video, isLocal = false }) => {
    const containerStyle = isLocal ?
        'absolute top-0 right-0 m-2 w-44 h-36 rounded-sm z-1 sm:h-66 sm:w-66 sm:m-4'
        : 'flex flex-grow items-start'

    return (
        <div className={containerStyle}>
            <video
                ref={video => video ? video.srcObject = stream : null}
                id="local-video"
                autoPlay={true}
                muted={isLocal}
                className='w-full h-full object-cover rounded-xl'
            />

            <div className={`absolute ${isLocal ? 'bottom-1' : 'top-1' } left-1 m-1`}>
                <p className="text-lg text-white font-bold bg-rtc-black rounded-xl px-2 py-1 sm:text-sm">
                    {name}
                </p>
            </div>
        </div>
    )
}

export default VisioVideo