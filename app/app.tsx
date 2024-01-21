"use client";

import { formatReserves, formatUserSummary } from "@aave/math-utils";
import dayjs from "dayjs";

import { MdCurrencyExchange } from "react-icons/md";
import {
  WagmiConfig,
  createConfig,
  sepolia,
  useAccount,
  useBalance,
  useChainId,
} from "wagmi";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { switchNetwork } from "wagmi/actions";
import Image from "next/image";
import Navbar from "./components/navbar";
import { Fragment, useEffect, useState } from "react";
import QRCode from "qrcode.react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/outline"; // Import clipboard icon
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import PermitTransfer from "./components/permit-gho-transfer";
import PermitBorrow from "./components/permit-gho-borrow";
import {RiExpandUpDownLine} from 'react-icons/ri'
import { Tooltip } from "react-tooltip";
import { BiSolidHelpCircle } from "react-icons/bi";
import { ethers } from "ethers";
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import axios from "axios";

export default function App() {
  const chainId = useChainId();
  const [appOpened, setAppOpened] = useState(false);
  const [isSending, setIsSending] = useState(true); // Can be sending or receiving, using bool for simplicity
  const [sendMethod, setSendMethod] = useState("");
  const [receiveMethod, setReceiveMethod] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyAmount, setCurrencyAmount] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const { address: user } = useAccount();
  const [firstBalanceChangeCheck, setFirstBalanceChangeCheck] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogCurrencyOpen, setIsDialogCurrencyOpen] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet"); // 'wallet' or 'borrow'
  const ghoBalance = useBalance({
    token: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
    address: user,
    watch: true,
  });
  const [prevGhoBalance, setPrevGhobalance] = useState(0)
  const [maxGhoBorrow, setMaxGhoBorrow] = useState(0);
  const [currenciesData, setCurrenciesData] = useState({} as CurrenciesData)
  const [selectedCurrency, setSelectedCurrency] = useState('AAVE' as 'AAVE' | 'ARS' | 'ETH' | 'BTC' | 'EUR')

interface CurrenciesData {
  AAVE: string
  ARS: string
  BTC: string
  EUR: string
  ETH: string
}

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      toast("Pasted from clipboard!", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setLinkValue(text);
    } catch (error) {
      console.error("Failed to read clipboard contents: ", error);
    }
  };

  const parsePaymentLink = (link: string) => {
    const url = new URL(link);
    const address = url.searchParams.get("address");
    const amount = url.searchParams.get("amount");
    return { address, amount };
  };

  const openDialog = () => {
    const { address, amount } = parsePaymentLink(linkValue);
    setReceiverAddress(address as string);
    setAmount(amount as string);
    setIsDialogOpen(true);
  };

  const generatePaymentLink = () => {
    const baseLink = `${location.origin}/pay`;
    return `${baseLink}?address=${encodeURIComponent(
      receiverAddress
    )}&amount=${encodeURIComponent(amount)}`;
  };

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get('https://api.currencyfreaks.com/latest?apikey=1fede581d867432e8bc140e61d209bac')
      console.log(response)
      setCurrenciesData(response.data.rates as CurrenciesData)
    }

    fetchData()
  }, [])

  useEffect(() => {
    console.log(currenciesData['AAVE'])
  }, [currenciesData])

  useEffect(() => {
    async function fetchContractData() {
      if (user) {
        const provider = new ethers.providers.JsonRpcProvider(
          "https://eth-sepolia.g.alchemy.com/v2/2_Fhzc4WRgdlybIVlDRn9akE4dH3I_Lp"
        );

        const poolDataProviderContract = new UiPoolDataProvider({
          uiPoolDataProviderAddress:
            markets.AaveV3Sepolia.UI_POOL_DATA_PROVIDER,
          provider,
          chainId: ChainId.sepolia,
        });

        // Object containing array of pool reserves and market base currency data
        // { reservesArray, baseCurrencyData }
        const reserves = await poolDataProviderContract.getReservesHumanized({
          lendingPoolAddressProvider:
            markets.AaveV3Sepolia.POOL_ADDRESSES_PROVIDER,
        });

        // Object containing array or users aave positions and active eMode category
        // { userReserves, userEmodeCategoryId }
        const userReserves =
          await poolDataProviderContract.getUserReservesHumanized({
            lendingPoolAddressProvider:
              markets.AaveV3Sepolia.POOL_ADDRESSES_PROVIDER,
            user: user as `0x${string}`,
          });

        const reservesArray = reserves.reservesData;
        const baseCurrencyData = reserves.baseCurrencyData;
        const userReservesArray = userReserves.userReserves;

        const currentTimestamp = dayjs().unix();

        const formattedPoolReserves = formatReserves({
          reserves: reservesArray,
          currentTimestamp,
          marketReferenceCurrencyDecimals:
            baseCurrencyData.marketReferenceCurrencyDecimals,
          marketReferencePriceInUsd:
            baseCurrencyData.marketReferenceCurrencyPriceInUsd,
        });

        /*
- @param `currentTimestamp` Current UNIX timestamp in seconds, Math.floor(Date.now() / 1000)
- @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
- @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
- @param `userReserves` Input from [Fetching Protocol Data](#fetching-protocol-data), combination of `userReserves.userReserves` and `reserves.reservesArray`
- @param `userEmodeCategoryId` Input from [Fetching Protocol Data](#fetching-protocol-data), `userReserves.userEmodeCategoryId`
*/
        const userSummary = formatUserSummary({
          currentTimestamp,
          marketReferencePriceInUsd:
            baseCurrencyData.marketReferenceCurrencyPriceInUsd,
          marketReferenceCurrencyDecimals:
            baseCurrencyData.marketReferenceCurrencyDecimals,
          userReserves: userReservesArray,
          formattedReserves: formattedPoolReserves,
          userEmodeCategoryId: userReserves.userEmodeCategoryId,
        });

        setMaxGhoBorrow(parseFloat(userSummary.availableBorrowsUSD) * 0.98);
      }
    }
    setReceiverAddress(user as `0x${string}`);
    fetchContractData();
  }, [user]);

  useEffect(() => {
    console.log('running now!')
    console.log(firstBalanceChangeCheck)
    console.log(Number(ghoBalance.data?.formatted))
    console.log(prevGhoBalance)
    if (prevGhoBalance < Number(ghoBalance.data?.formatted && firstBalanceChangeCheck)) {
      toast(`You've received a payment of ${(Number(ghoBalance.data?.formatted) - prevGhoBalance).toFixed(2)} GHO tokens!`,  {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      })
    }
    setPrevGhobalance(Number(ghoBalance.data?.formatted))
    setFirstBalanceChangeCheck(true)
  }, [ghoBalance]);

  const currencyOptions = ['AAVE', 'ARS', 'BTC', 'ETH', 'EUR']

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

  const whiteBackBtn = () => (
    <div className="d-flex">
      <button
        style={{ display: "flex" }}
        className="justify-center button m-auto mt-5 bg-white text-black px-4 py-2 rounded-xl w-[120px]"
        onClick={() => {
          setSendMethod("");
          setReceiveMethod("");
        }}
      >
        Back
      </button>
    </div>
  );
  const payBtn = () => (
    <div className="d-flex">
      <button
        style={{ display: "flex" }}
        className="justify-center button m-auto mt-5 bg-green-500 text-white px-4 py-2 rounded-xl w-[120px] disabled:opacity-50"
        disabled={!linkValue.startsWith(location.origin)}
        onClick={openDialog}
      >
        Pay
      </button>
    </div>
  );

  useEffect(() => {
    console.log(isDialogOpen);
  }, [isDialogOpen]);

  const linkSend = () => {
    return (
      <div className="flex flex-col items-center space-y-4 mt-4 w-full">
        <div className="w-full">
          <span className="text-sm font-medium text-gray-700">
            Payment link
          </span>
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
        </div>
        <div className="flex">
          <div className="mr-3">{payBtn()}</div>
          {backBtn()}
        </div>
      </div>
    );
  };

  const qrSend = () => {
    return (
      <div className="flex flex-col items-center justify-center">
        <QrScanner
          containerStyle={{
            position: "absolute",
            height: "100vh",
            width: "100vw",
            padding: "0",
            backgroundColor: "black",
            zIndex: 10,
            top: 0,
          }}
          onDecode={(result) => {
            console.log(result);
            setLinkValue(result);
          }}
          onError={(error) => console.log(error?.message)}
        />
        <div className="absolute z-50 bottom-10">{whiteBackBtn()}</div>
      </div>
    );
  };

  useEffect(() => {
    if (sendMethod == "qr") {
      setSendMethod("link");
      openDialog();
    }
  }, [linkValue]);

  useEffect(() => {
    const generatePaymentLink = () => {
      const baseLink = `${location.origin}/pay`;
      return `${baseLink}?address=${encodeURIComponent(
        receiverAddress
      )}&amount=${encodeURIComponent(amount)}`;
    };
    setPaymentLink(generatePaymentLink());
  }, [amount, receiverAddress]);

  const linkReceive = () => {
    return (
      <div className="flex flex-col items-center space-y-4 mt-4 w-full">
        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Amount (GHO)
          </span>
          <div className="flex w-full items-center justify-between p-2 border border-gray-300 rounded-lg">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-lg"
            />

            <button
              className="ml-2"
              onClick={() => {
                setIsDialogCurrencyOpen(true);
              }}
            >
              <MdCurrencyExchange
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </button>
          </div>
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
            <input
              className="w-full bg-gray-50 text-sm break-words"
              disabled
              value={paymentLink}
            />
            <button
              className="ml-2"
              onClick={() => {
                navigator.clipboard.writeText(paymentLink);
                toast("Copied to clipboard!", {
                  position: "bottom-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "light",
                  transition: Bounce,
                });
              }}
            >
              <ClipboardIcon
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </button>
          </div>
          <QRCode className="m-auto mt-5" value={paymentLink} size={164} />
        </label>

        {backBtn()}
      </div>
    );
  };

  const qrReceive = () => {
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
                Payment link
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
            <button
              onClick={() => setReceiveMethod("link")}
              className="bg-green-600 text-white hover:text-green-700 hover:border-green-700 font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
            >
              Create Payment Request
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center pt-6 p-12 bg-gray-50">
      <ToastContainer />
      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDialogOpen(false)}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-6 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Confirm Payment
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-xs mb-2 text-gray-500">
                        <span className="font-semibold">Receiver</span> <br />
                        <span className="break-all">{receiverAddress}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Amount</span> <br />
                        {amount} GHO
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-md font-small text-gray-900 mb-4">
                    Payment Method
                  </div>
                  <div className="flex items-center">
                    <input
                      id="wallet"
                      name="paymentMethod"
                      type="radio"
                      disabled={
                        Number(amount) > Number(ghoBalance.data?.formatted)
                      }
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label
                      htmlFor="wallet"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Pay with Wallet Tokens
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 ml-8">
                    Available: {ghoBalance.data?.formatted} GHO
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      id="borrow"
                      name="paymentMethod"
                      type="radio"
                      disabled={Number(amount) > maxGhoBorrow}
                      checked={paymentMethod === "borrow"}
                      onChange={() => setPaymentMethod("borrow")}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label
                      htmlFor="borrow"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Borrow GHO
                    </label>
                    <a
                      className="bg-gray-50 ml-2 rounded-circle rounded-full"
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="Use your AAVE supplied assets & borrow GHO"
                    >
                      <BiSolidHelpCircle />
                    </a>
                    <Tooltip id="my-tooltip" />
                  </div>

                  <div className="text-xs text-gray-500 ml-8">
                    Available: {maxGhoBorrow.toFixed(2)} GHO
                  </div>

                  {Number(amount) > Number(ghoBalance.data?.formatted) &&
                  Number(amount) > maxGhoBorrow ? (
                    <div className="flex justify-end mt-4">
                      <button className="bg-red-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none disabled:opacity-50 focus:shadow-outline transform transition hover:scale-105 duration-300 mt-5 w-full ease-in-out opacity-50">
                        Insufficient funds
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end mt-4">
                      {/* ... (Pay or Borrow buttons based on paymentMethod) */}
                      {Number(amount) <= Number(ghoBalance.data?.formatted) &&
                      Number(amount) <= maxGhoBorrow &&
                      paymentMethod === "wallet" ? (
                        <PermitTransfer
                          receiverAddress={receiverAddress}
                          amount={amount}
                        />
                      ) : (
                        <PermitBorrow
                          receiverAddress={receiverAddress}
                          amount={amount}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <Transition appear show={isDialogCurrencyOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDialogCurrencyOpen(false)}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block h-[400px] w-full  align-bottom bg-white rounded-lg px-6 pt-5 pb-4  text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Custom currency
                    </Dialog.Title>
                    <div className="fixed top-16 w-72">
       
                    <span className="text-sm font-medium text-gray-700">
            Currency
          </span>
      <Listbox value={selectedCurrency} onChange={setSelectedCurrency}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{selectedCurrency}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <RiExpandUpDownLine
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {currencyOptions.map(currency => {
                return (
                  
                <Listbox.Option
                  key={currency}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={currency}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        <div className="flex">
<span>{currency}</span>
<Image
              className="ml-2"
              src={`https://currencyfreaks.com/photos/flags/${currency.toLowerCase()}.png?v=0.1`}
              alt="Tap Icon"
              width={20}
              height={20}
            />            
                        </div>
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
                )
              })}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      <p className="text-sm font-medium mt-5 text-gray-700">
            Amount ({selectedCurrency})
          </p>
            <input
              type="text"
              value={currencyAmount}
              onChange={(e) => setCurrencyAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-20">GHO amount: {Number(currencyAmount) / Number(currenciesData[selectedCurrency])}</p>
            <button onClick={() => {setIsDialogCurrencyOpen(false); setAmount((Number(currencyAmount) / Number(currenciesData[selectedCurrency])).toString())}} className="mt-5 mr-3 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">Save</button>
    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <ConnectKitButton showBalance />
      </div>
      {/* Landing Page Section */}
      {!appOpened && (
        <section className="text-center mt-12 mb-12">
          <div className="mb-6 d-flex">
            <Image
              className="m-auto"
              src="/android-chrome-192x192.png"
              alt="Tap Icon"
              width={120}
              height={120}
            />
          </div>
          <h1 className="text-4xl font-bold mb-3">Welcome to Tap</h1>
          <p className="text-lg">
            Send and receive payments fast and easy with GHO 👻
          </p>
          <button
            onClick={() => {
              setAppOpened(true);
              setIsSending(true);
            }}
            className="mt-5 mr-3 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Send
          </button>
          <button
            onClick={() => {
              setAppOpened(true);
              setIsSending(false);
            }}
            className="mt-5 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Receive
          </button>
        </section>
      )}
      {chainId === sepolia.id && appOpened && (
        <div className="mt-12 mb-5 w-full">
          <h1 className="text-2xl font-bold mb-3">Balances</h1>

          <p>GHO balance: {ghoBalance.data?.formatted}</p>
          <p>Max borrowable GHO: {maxGhoBorrow.toFixed(0)}</p>
        </div>
      )}
      {chainId === sepolia.id && appOpened && renderActions()}
      {chainId !== sepolia.id && (
        <button
          onClick={async () => await switchNetwork({ chainId: sepolia.id })}
          className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Switch to Sepolia!!!
        </button>
      )}
      {appOpened && (
        <Navbar
          isSending={isSending}
          setIsSending={setIsSending}
          setSendMethod={setSendMethod}
          setReceiveMethod={setReceiveMethod}
        />
      )}
    </main>
  );
}
