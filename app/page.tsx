"use client";

import { WagmiConfig, createConfig, sepolia, useAccount, useChainId } from "wagmi";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { switchNetwork } from "wagmi/actions";
import Image from "next/image";
import Navbar from "./components/navbar";
import { useState } from "react";
import QRCode from "qrcode.react";
import { ClipboardIcon } from "@heroicons/react/outline"; // Import clipboard icon
import App from "./app";

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
  const [isSending, setIsSending] = useState(true); // Can be sending or receiving, using bool for simplicity
  const [sendMethod, setSendMethod] = useState("");
  const [receiveMethod, setReceiveMethod] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [amount, setAmount] = useState("");
  const [receiverAddress, setReceiverAddress] = useState('');


  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLinkValue(text);
    } catch (error) {
      console.error("Failed to read clipboard contents: ", error);
    }
  };

  const backBtn = () => (
    <div className="d-flex">
      <button
        style={{ display: "flex" }}
        className="justify-center button m-auto mt-5 bg-black text-white px-4 py-2 rounded-xl w-[120px]"
        onClick={() => {
          setSendMethod("");
          setReceiveMethod("");
        }}
      >
        Back
      </button>
    </div>
  );

  const linkSend = () => {
    return (
      <div className="flex flex-col items-center space-y-4 mt-4 w-full">
        <div className="flex w-full items-center justify-center">
          <input
            type="text"
            placeholder="Paste payment link here"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            className="w-[90%] p-2 border border-gray-300 rounded-lg"
          />
          <button onClick={pasteFromClipboard} className="items-center pr-3">
            <ClipboardIcon
              className="h-5 w-5 text-gray-500"
              aria-hidden="true"
            />
          </button>
        </div>
        {backBtn()}
      </div>
    );
  };

  const qrSend = () => {
    return (
      <div className="flex flex-col items-center justify-center">
        Scan the QR and pay!
        {backBtn()}
      </div>
    );
  };

  const generatePaymentLink = () => {
    const baseLink = `${location.origin}/pay`;
    return `${baseLink}?address=${encodeURIComponent(
      receiverAddress
    )}&amount=${encodeURIComponent(amount)}`;
  };

  const linkReceive = () => {
    const paymentLink = generatePaymentLink(); // Call the same generatePaymentLink function

    return (
      <div className="flex flex-col items-center space-y-4 mt-4 w-full">
        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Amount (GHO)</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Receiver address
          </span>
          <input
            type="text"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Payment link
          </span>
          <div className="flex w-full items-center justify-between p-2 border border-gray-300 rounded-lg">
            <span className="text-sm break-words">{paymentLink}</span>
            <button
              onClick={() => navigator.clipboard.writeText(paymentLink)}
              className="ml-2"
            >
              <ClipboardIcon
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </button>
          </div>
        </label>

        {backBtn()}
      </div>
    );
  };

  const qrReceive = () => {
    const paymentLink = generatePaymentLink(); // Call the same generatePaymentLink function

    return (
      <div className="d-flex w-full flex-col justify-center items-center">
        <QRCode className="m-auto" value={paymentLink} size={164} />
        {backBtn()}
      </div>
    );
  };

  const renderActions = () => {
    if (isSending) {
      return (
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {sendMethod === "link" && linkSend()}
          {sendMethod === "qr" && qrSend()}

          {!["link", "qr"].includes(sendMethod) && (
            <>
              <button
                onClick={() => setSendMethod("link")}
                className="text-yellow-600 border border-yellow-600 hover:text-yellow-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
              >
                Pay with Link
              </button>
              <button
                onClick={() => setSendMethod("qr")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
              >
                Scan QR Code
              </button>
            </>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {receiveMethod === "link" && linkReceive()}
          {receiveMethod === "qr" && qrReceive()}
          {!["link", "qr"].includes(receiveMethod) && (
            <>
              <button
                onClick={() => setReceiveMethod("link")}
                className="text-green-600 border border-green-600 hover:text-green-700 hover:border-green-700 font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
              >
                Create Payment Link
              </button>
              <button
                onClick={() => setReceiveMethod("qr")}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
              >
                Generate QR Code
              </button>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <QueryClientProvider client={queryClient}>
         <App />
        </QueryClientProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
