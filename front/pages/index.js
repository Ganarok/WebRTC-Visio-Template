import { useRouter } from "next/router"
import { useState } from "react"

const Home = () => {
    const [ id, setId ] = useState('')
    const [ name, setName ] = useState('')
    const router = useRouter()

    const handleValues = () => {
        if (!id)
            router.push(`/${(Date.now()).toString()}${name && '?name='+name}`)
        else
            router.push(`/${id}${name && '?name='+name}`)
        }

    const handleJoin = () => {
        if (!id)
            return
        
        router.push(`/${id}${name && '?name='+name}`)
    }

    return (
        <div className="flex flex-col items-center justify-evenly font-bold text-center h-screen">
            <h1 className="text-3xl sm:text-4xl">
                WebRTC Conference
            </h1>

            <div className="space-y-6">
                <h3>
                    Define your name
                </h3>

                <input 
                    placeholder="Enter your name here"
                    value={name}
                    onChange={(v) => setName(v.target.value)}
                    className="input"
                />
            </div>

            <div className="flex flex-col space-y-4">
                <h3>
                    Join a specific room
                </h3>

                <input 
                    placeholder="Room ID to join"
                    value={id}
                    onChange={(v) => setId(v.target.value)}
                    className="input"
                />

                <div className="relative">
                    <button
                        className="btn shadow-solid"
                        onClick={handleJoin.bind(this)}
                    >
                        JOIN
                    </button>
                </div>
            </div>

            <div className="bg-white w-1/2 max-w-sm rounded-sm h-0.5" />

            <div className="space-y-4">
                <h3>
                    ... or create a new one !
                </h3>

                <button
                    className="btn shadow-solid"
                    onClick={handleValues.bind(this)}
                >
                    GENERATE
                </button>
            </div>
        </div>
    )
}

export default Home
