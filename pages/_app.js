import { SessionProvider } from "next-auth/react"
import "../styles/globals.css"
import { WagmiProvider } from "wagmi"

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider autoConnect>
      <SessionProvider session={pageProps.session} refetchInterval={0}>
        <Component {...pageProps} />
      </SessionProvider>
    </WagmiProvider>
  )
}
