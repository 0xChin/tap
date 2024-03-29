import { NextApiRequest, NextApiResponse } from "next";
import { account, publicClient, walletClient } from "../../config";
import { erc20ABI } from "@/utils/erc20ABI";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { to, value } = req.body;

      const { request: transferRequest } = await publicClient.simulateContract({
        account,
        address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
        abi: erc20ABI,
        functionName: "transfer",
        args: [to, BigInt(value)],
      });

      const hash = await walletClient.writeContract(transferRequest);

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
