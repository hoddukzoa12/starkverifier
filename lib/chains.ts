import { defineChain } from "thirdweb/chains";

/**
 * Arbitrum Sepolia Testnet Configuration
 * Chain ID: 421614
 */
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "Arbitrum Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: "https://sepolia-rollup.arbitrum.io/rpc",
  blockExplorers: [
    {
      name: "Arbiscan",
      url: "https://sepolia.arbiscan.io",
    },
  ],
  testnet: true,
});

/**
 * Supported chains for the application
 */
export const supportedChains = [arbitrumSepolia];
