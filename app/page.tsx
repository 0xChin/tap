"use client";

import { WagmiConfig, createConfig, sepolia, useChainId } from "wagmi";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PermitTransfer from "./permit-gho-transfer";
import PermitBorrow from "./permit-gho-borrow";
import { switchNetwork } from "wagmi/actions";
import Image from "next/image";

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: "2_Fhzc4WRgdlybIVlDRn9akE4dH3I_Lp", // or infuraId
    walletConnectProjectId: "f7e2d776b4da5027f90560bee0f12c9c",

    // Required
    appName: "Tap",

    // Optional
    appDescription: "Tap",
    appUrl: "https://family.co", // your app's url
    chains: [sepolia],
  })
);

const queryClient = new QueryClient();

export default function Home() {
  const chainId = useChainId();

  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <QueryClientProvider client={queryClient}>
          <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
              <ConnectKitButton showBalance />
            </div>

            {/* Landing Page Section */}
            <section className="text-center mt-12 mb-12">
              <div className="mb-6 d-flex">
                <Image
                  className="m-auto"
                  src="/android-chrome-192x192.png"
                  alt="Tap Icon"
                  width={162}
                  height={162}
                />
              </div>
              <h1 className="text-4xl font-bold mb-3">Welcome to Tap</h1>
              <p className="text-lg">Send and receive payments fast and easy</p>
            </section>
            {chainId === sepolia.id ? (
              <div className="mt-5 d-flex">
                <button className="bg-yellow-500 mr-2 hover:bg-yellow-700 text-white font-bold py-2 px-8 rounded focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out">
                  Send
                </button>
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-8 rounded focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out">
                  Receive
                </button>{" "}
              </div>
            ) : (
              <button
                onClick={async () =>
                  await switchNetwork({ chainId: sepolia.id })
                }
                className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Switch to Sepolia!!!
              </button>
            )}
          </main>
        </QueryClientProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
