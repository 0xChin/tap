import { erc20ABI } from "@/utils/erc20ABI";
import { useState } from "react";
import axios from "axios";
import { hexToNumber, parseEther, slice } from "viem";
import { sepolia, useAccount, useContractRead, useSignTypedData } from "wagmi";

interface IPermitBorrow {
  receiverAddress: string
  amount: string
}

export default function PermitBorrow({receiverAddress, amount}: IPermitBorrow) {
  const [deadline, setDeadline] = useState(BigInt(0));
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const { address: user } = useAccount();

  const { data: nonce } = useContractRead({
    chainId: sepolia.id,
    address: "0x67ae46EF043F7A4508BD1d6B94DB6c33F0915844",
    abi: erc20ABI,
    functionName: "nonces",
    args: [user as `0x${string}`],
  });

  const sendTransferData = async (body: object) => {
    setIsSending(true); 
    try {
      const response = await axios.post("/api/gho-borrow", body);
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
        delegator: user,
        delegatee: receiverAddress,
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
      className="bg-green-500 mt-5 w-full hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out"
      disabled={isSending}
      onClick={() => {
        if (txHash) {
          location.assign(`https://sepolia.etherscan.io/tx/${txHash}`)
        } else {

          const newDeadline = BigInt(Math.floor(Date.now() / 1000) + 100_000);
          setDeadline(newDeadline);
          signTypedData({
            domain: {
              name: "Aave Variable Debt Sepolia GHO",
              chainId: 11155111,
              verifyingContract: "0x67ae46EF043F7A4508BD1d6B94DB6c33F0915844",
              version: "1",
            },
            types: {
              DelegationWithSig: [
                { name: "delegatee", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
              ],
            },
            primaryType: "DelegationWithSig", 
            message: {
              delegatee: receiverAddress,
              value: parseEther(amount),
              deadline: newDeadline,
              nonce,
            },
          });
        }}
        }
    >
      {isSending ? 'Processing transaction...' : txHash ? 'View your transaction' : 'Borrow GHO'}
    </button>
  );
}
