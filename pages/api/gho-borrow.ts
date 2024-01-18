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

      console.log(req.body);

      const { request: creditDelegationRqeuest } =
        await publicClient.simulateContract({
          account,
          address: "0x67ae46EF043F7A4508BD1d6B94DB6c33F0915844",
          abi: ghoDebtTokenABI,
          functionName: "delegationWithSig",
          args: [
            delegator,
            delegatee,
            BigInt(value),
            BigInt(deadline),
            v,
            r,
            s,
          ],
        });

      let hash = await walletClient.writeContract(creditDelegationRqeuest);

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

      hash = await walletClient.writeContract(transferRequest);

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
