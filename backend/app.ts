import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sepolia } from "viem/chains";
import { Request, Response } from "express";
import { account, publicClient, walletClient } from "./config";
import { erc20ABI } from "./erc20ABI";
import dotenv from "dotenv";

interface PermitRequestBody {
  owner: `0x${string}`; // Assuming owner is a string (e.g., an Ethereum address)
  spender: `0x${string}`; // Same as above
  value: string; // String representation of a numeric value
  deadline: string; // String representation of a deadline (BigInt)
  r: `0x${string}`; // Signature component r
  s: `0x${string}`; // Signature component s
  v: number; // Signature component v (usually a number)
}

dotenv.config();
const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

const client = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: sepolia,
  transport: http(
    "https://eth-sepolia.g.alchemy.com/v2/2_Fhzc4WRgdlybIVlDRn9akE4dH3I_Lp"
  ),
});

// POST route to handle gho-transfer
app.post("/gho-transfer", async (req: Request, res: Response) => {
  const { owner, spender, value, deadline, r, s, v } =
    req.body as PermitRequestBody;

  const { request: permitRequest } = await publicClient.simulateContract({
    account,
    address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
    abi: erc20ABI,
    functionName: "permit",
    args: [owner, spender, BigInt(value), BigInt(deadline), v, r, s],
  });

  let txHash = await walletClient.writeContract(permitRequest);

  const { request: transferRequest } = await publicClient.simulateContract({
    account,
    address: "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
    abi: erc20ABI,
    functionName: "transferFrom",
    args: [owner, spender, BigInt(value)],
  });

  txHash = await walletClient.writeContract(transferRequest);

  res.status(200).send(`TX: ${txHash}`);
});

app.listen(4000, () => {
  console.log("Running on port 4000");
});
