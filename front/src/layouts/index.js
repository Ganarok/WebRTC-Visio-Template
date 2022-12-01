import Head from "next/head"

export default function Layout({ children }) {

    return (
        <>
            <Head>
                <title>WebRTC Conference</title>
                <meta name="description" content="Zoom-like conference using WebRTC technology" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            { children }
        </>
    )
}