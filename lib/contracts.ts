import { getContract } from "thirdweb";
import { client } from "./client";
import { arbitrumSepolia } from "./chains";

/**
 * Contract addresses on Arbitrum Sepolia
 * Update these after deployment
 */
export const STYLUS_VERIFIER_ADDRESS =
  "0x327c65e04215bd5575d60b00ba250ed5dd25a4fc" as const;
export const SOLIDITY_VERIFIER_ADDRESS =
  "0x96326E368b6f2fdA258452ac42B1aC013238f5Ce" as const;

/**
 * Verifier contract ABI
 * Shared interface for both Stylus and Solidity implementations
 */
export const VERIFIER_ABI = [
  {
    type: "function",
    name: "poseidonHash",
    inputs: [
      { name: "a", type: "uint256" },
      { name: "b", type: "uint256" },
    ],
    outputs: [{ name: "hash", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "batchPoseidon",
    inputs: [
      { name: "inputsA", type: "uint256[]" },
      { name: "inputsB", type: "uint256[]" },
    ],
    outputs: [{ name: "hashes", type: "uint256[]" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "verifyMerklePath",
    inputs: [
      { name: "root", type: "uint256" },
      { name: "leaf", type: "uint256" },
      { name: "path", type: "uint256[]" },
      { name: "indices", type: "bool[]" },
    ],
    outputs: [{ name: "valid", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLastResult",
    inputs: [],
    outputs: [
      { name: "root", type: "uint256" },
      { name: "result", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVerificationCount",
    inputs: [],
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "benchmarkHash",
    inputs: [
      { name: "iterations", type: "uint32" },
      { name: "seedA", type: "uint256" },
      { name: "seedB", type: "uint256" },
    ],
    outputs: [{ name: "result", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "event",
    name: "MerkleVerified",
    inputs: [
      { name: "root", type: "uint256", indexed: true },
      { name: "leaf", type: "uint256", indexed: false },
      { name: "result", type: "bool", indexed: false },
    ],
  },
] as const;

/**
 * Get Stylus verifier contract instance
 */
export const getStylusContract = () =>
  getContract({
    client,
    chain: arbitrumSepolia,
    address: STYLUS_VERIFIER_ADDRESS,
    abi: VERIFIER_ABI,
  });

/**
 * Get Solidity verifier contract instance
 */
export const getSolidityContract = () =>
  getContract({
    client,
    chain: arbitrumSepolia,
    address: SOLIDITY_VERIFIER_ADDRESS,
    abi: VERIFIER_ABI,
  });

/**
 * Contract type for verification
 */
export type VerifierType = "stylus" | "solidity";

/**
 * Verification result interface
 */
export interface VerificationResult {
  type: VerifierType;
  success: boolean;
  gasUsed: bigint;
  txHash: string;
  timestamp: number;
  error?: string;
}

/**
 * Benchmark data point interface
 */
export interface BenchmarkData {
  depth: number;
  stylusGas: number;
  solidityGas: number;
  savings: string;
}

/**
 * Expected benchmark results based on OpenZeppelin research
 */
export const EXPECTED_BENCHMARKS: BenchmarkData[] = [
  { depth: 8, stylusGas: 13000, solidityGas: 240000, savings: "18x" },
  { depth: 16, stylusGas: 26000, solidityGas: 480000, savings: "18x" },
  { depth: 32, stylusGas: 52000, solidityGas: 960000, savings: "18x" },
];

/**
 * Generate test Merkle proof data for a given depth
 */
export function generateTestProof(depth: number): {
  root: bigint;
  leaf: bigint;
  path: bigint[];
  indices: boolean[];
} {
  // Generate deterministic test data
  const leaf = BigInt("0x1234567890abcdef1234567890abcdef");
  const path: bigint[] = [];
  const indices: boolean[] = [];

  for (let i = 0; i < depth; i++) {
    // Generate pseudo-random sibling values
    path.push(BigInt(`0x${(i + 1).toString(16).padStart(64, "0")}`));
    indices.push(i % 2 === 0);
  }

  // In production, this would be the actual computed root
  const root = BigInt("0x9876543210fedcba9876543210fedcba");

  return { root, leaf, path, indices };
}
