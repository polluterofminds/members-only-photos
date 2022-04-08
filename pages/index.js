import Head from "next/head";
import { getCsrfToken, signIn, useSession } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi';
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [{ data: connectData }, connect] = useConnect()
  const [, signMessage] = useSignMessage()
  const [{ data: networkData }] = useNetwork()
  const [{ data: accountData }] = useAccount();
  const { data: session } = useSession()

  useEffect(() => {
    if(session) {
      router.push("/gallery")
    }
  }, [session])

  const handleLogin = async () => {
    try {
      await connect(connectData.connectors[0]);
      const callbackUrl = '/gallery';
      const message = new SiweMessage({
        domain: window.location.host,
        address: accountData?.address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: networkData?.chain?.id,
        nonce: await getCsrfToken()
      });
      const {data: signature, error} = await signMessage({ message: message.prepareMessage() });
      const res = await signIn('credentials', { message: JSON.stringify(message), redirect: false, signature, callbackUrl });
      if(res.url) {
        router.push("/gallery");
      } else {
        throw new Error("Invalid sign in attempt")
      }
    } catch (error) {
      window.alert(error)
    }
  }

  return (
    <div>
      <Head>
        <title>Members Only Photos</title>
        <meta name="description" content="An NFT Powered Members Only Photo App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <h1>Members Only</h1>
        <p>You have to own [Insert NFT name] to access the gallery.</p>
        <button onClick={handleLogin}>Sign In With Ethereum</button>
      </div>
    </div>
  );
}
