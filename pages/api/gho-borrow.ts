import { NextApiRequest, NextApiResponse } from "next";
import { account, publicClient, walletClient } from "../../config";
import { ghoDebtTokenABI } from "@/utils/ghoDebtTokenABI";
import { poolABI } from "@/utils/poolABI";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { delegator, delegatee, value, deadline, r, s, v } = req.body;

      const { request: transferRequest } = await publicClient.simulateContract({
        account,
        address: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
        abi: poolABI,
        functionName: "borrow",
        args: [
          "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
          value,
          2,
          0,
          delegator,
        ],
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
