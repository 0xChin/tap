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
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
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
          <main className="flex min-h-screen flex-col items-center p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
              <ConnectKitButton showBalance />
            </div>
            {chainId === sepolia.id ? (
              <>
                <div className="mt-5">
                  <PermitTransfer />
                </div>
                <div className="mt-5">
                  <PermitBorrow />
                </div>
              </>
            ) : (
              <button
                onClick={async () =>
                  await switchNetwork({ chainId: sepolia.id })
                }
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
