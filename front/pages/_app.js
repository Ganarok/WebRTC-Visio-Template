import '@/styles/globals.css'
import Layout from '@/layouts/index'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    )
}

export default MyApp
