import { useRouter } from "next/router"
import { useState } from "react"

export default Home = () => {
    const [ id, setId ] = useState('')
    const [ name, setName ] = useState('')
    const router = useRouter()

    const handleValues = () => {
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
