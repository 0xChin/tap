import { createPublicClient, createWalletClient, custom, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(
    "https://eth-sepolia.g.alchemy.com/v2/2_Fhzc4WRgdlybIVlDRn9akE4dH3I_Lp"
  ),
});

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(
    "https://eth-sepolia.g.alchemy.com/v2/2_Fhzc4WRgdlybIVlDRn9akE4dH3I_Lp"
  ),
});

export const account = privateKeyToAccount(
  process.env.PRIVATE_KEY as `0x${string}`
);
