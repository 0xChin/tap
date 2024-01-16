import { erc20ABI } from "@/utils/erc20ABI";
import { useEffect, useState } from "react";
import { hexToNumber, parseEther, slice } from "viem";
import { sepolia, useAccount, useContractRead, useSignTypedData } from "wagmi";

export default function Permit() {
  const [deadline, setDeadline] = useState(BigInt(0));
  const { address: user } = useAccount();

  const { data: nonce } = useContractRead({
    chainId: sepolia.id,
    address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
    abi: erc20ABI,
    functionName: "nonces",
    args: [user as `0x${string}`],
  });

  const { signTypedData } = useSignTypedData({
    onSuccess(data) {
      const typedData = data as `0x${string}`;

      const [r, s, v] = [
        slice(typedData, 0, 32),
        slice(typedData, 32, 64),
        slice(typedData, 64, 65),
      ];

      const body = {
        owner: user,
        spender: "0xe84DbC4EE14b0360B7bF87c7d30Cd0604E0e1E0F",
        value: parseEther("10000"),
        deadline,
        r,
        s,
        v: hexToNumber(v),
      };

      console.log(body)
    },
  });

  return (
    <button
      onClick={() => {
        const newDeadline = BigInt(Math.floor(Date.now() / 1000) + 100_000)
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
            spender: "0xe84DbC4EE14b0360B7bF87c7d30Cd0604E0e1E0F",
            value: parseEther("10000"),
            deadline: newDeadline,
            nonce,
          },
        });
      }}
    >
      Sign message
    </button>
  );
}
