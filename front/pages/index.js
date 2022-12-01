import { useRouter } from "next/router"
import { useState } from "react"

const Home = () => {
    const [ id, setId ] = useState('')
    const [ name, setName ] = useState('')
    const router = useRouter()

    const handleValues = () => {
        if (!id)
            router.push(`/${(Math.random() + 1).toString(36).substring(10)}${name && '?name='+name}`)
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
                Visio conférence WebRTC
            </h1>

            <div className="space-y-6">

                <h3>
                    Définissez votre nom
                </h3>

                <input 
                    placeholder="Entrez votre nom ici"
                    value={name}
                    onChange={(v) => setName(v.target.value)}
                    className="input"
                />
            </div>


            <div className="space-y-6">

                <h3>
                    Rejoignez une room spécifique
                </h3>

                <input 
                    placeholder="ID de la room"
                    value={id}
                    onChange={(v) => setId(v.target.value)}
                    className="input"
                />

                <button
                    className="btn shadow-solid"
                    onClick={handleJoin.bind(this)}
                >
                    JOIN
                </button>
            </div>

            <div className="bg-white w-1/2 max-w-sm rounded-sm h-0.5" />

            <div className="space-y-4">
                <h3>
                    ... ou générez-en une !
                </h3>

                <button
                    className="btn shadow-solid"
                    onClick={handleValues.bind(this)}
                >
                    GENERER
                </button>
            </div>
        </div>
    )
}

export default Home
