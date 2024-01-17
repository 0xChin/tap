import { erc20ABI } from "@/utils/erc20ABI";
import { useState } from "react";
import axios from "axios";
import { hexToNumber, parseEther, slice } from "viem";
import { sepolia, useAccount, useContractRead, useSignTypedData } from "wagmi";

export default function PermitBorrow() {
  const [deadline, setDeadline] = useState(BigInt(0));
  const { address: user } = useAccount();

  const { data: nonce } = useContractRead({
    chainId: sepolia.id,
    address: "0x67ae46EF043F7A4508BD1d6B94DB6c33F0915844",
    abi: erc20ABI,
    functionName: "nonces",
    args: [user as `0x${string}`],
  });

  const sendTransferData = async (body: object) => {
    try {
      const response = await axios.post("/api/gho-borrow", body);
      console.log(response.data); // Handle the response as needed
    } catch (error) {
      console.error("Error sending transfer data:", error);
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
        delegatee: "0xe84DbC4EE14b0360B7bF87c7d30Cd0604E0e1E0F",
        value: parseEther("1").toString(),
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
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out"
      onClick={() => {
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
            Permit: [
              { name: "delegatee", type: "address" },
              { name: "value", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "deadline", type: "uint256" },
            ],
          },
          primaryType: "Permit",
          message: {
            delegatee: "0xe84DbC4EE14b0360B7bF87c7d30Cd0604E0e1E0F",
            value: parseEther("1"),
            deadline: newDeadline,
            nonce,
          },
        });
      }}
    >
      Permit GHO borrow
    </button>
  );
}
