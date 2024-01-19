import { erc20ABI } from "@/utils/erc20ABI";
import { useState } from "react";
import axios from "axios";
import { hexToNumber, parseEther, slice } from "viem";
import { sepolia, useAccount, useContractRead, useSignTypedData } from "wagmi";

interface IPermitTransfer {
  receiverAddress: string
  amount: string
}

export default function PermitTransfer({receiverAddress, amount}: IPermitTransfer) {
  const [deadline, setDeadline] = useState(BigInt(0));
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const { address: user } = useAccount();

  const { data: nonce } = useContractRead({
    chainId: sepolia.id,
    address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
    abi: erc20ABI,
    functionName: "nonces",
    args: [user as `0x${string}`],
  });

  const sendTransferData = async (body: object) => {
    setIsSending(true); 
    try {
      const response = await axios.post("/api/gho-transfer", body);
      setTxHash(response.data.json.hash); // Assume the response contains the txHash
      setIsSending(false); // End sending process
      console.log(response.data); // Handle the response as needed
    } catch (error) {
      console.error("Error sending transfer data:", error);
      setIsSending(false); // End sending process
    }
  };

  const { signTypedData } = useSignTypedData({
    onSuccess(data) {
      const typedData = data as `0x${string}`;

      const [r, s, v] = [
        slice(typedData, 0, 32),
        slice(typedData, 32, 64),
        slice(typedData, 64, 65),
      ];

      const body = {
        user,
        owner: user,
        spender: receiverAddress,
        value: parseEther(amount).toString(),
        deadline: deadline.toString(),
        r,
        s,
        v: hexToNumber(v),
      };

      sendTransferData(body); // Send data to the backend
    },
  });

  return (
    <button
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none disabled:opacity-50 focus:shadow-outline transform transition hover:scale-105 duration-300 mt-5 w-full ease-in-out"
      disabled={isSending}
      onClick={() => {
        if (txHash) {
          location.assign(`https://sepolia.etherscan.io/tx/${txHash}`)
        } else {

          const newDeadline = BigInt(Math.floor(Date.now() / 1000) + 100_000);
          setDeadline(newDeadline);
          signTypedData({
            domain: {
              name: "Gho Token",
              chainId: 11155111,
              verifyingContract: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
              version: "1",
            },
            types: {
              Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
              ],
            },
            primaryType: "Permit",
            message: {
              owner: user,
              spender: receiverAddress,
              value: parseEther(amount),
              deadline: newDeadline,
              nonce,
            },
          });
        }
      }}
    >
      {isSending ? 'Processing transaction...' : txHash ? 'View your transaction' : 'Permit GHO'}
    </button>
  );
}
