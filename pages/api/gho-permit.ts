import { NextApiRequest, NextApiResponse } from "next";
import { account, publicClient, walletClient } from "../../config";
import { erc20ABI } from "@/utils/erc20ABI";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { owner, spender, value, deadline, r, s, v } = req.body;

      const { request: permitRequest } = await publicClient.simulateContract({
        account,
        address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
        abi: erc20ABI,
        functionName: "permit",
        args: [
          owner,
          "0xe84DbC4EE14b0360B7bF87c7d30Cd0604E0e1E0F",
          BigInt(value),
          BigInt(deadline),
          v,
          r,
          s,
        ],
      });

      const hash = await walletClient.writeContract(permitRequest);

      res.status(200).json({ json: { hash } });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error executing tx" });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
