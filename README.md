# STARK Stylus Verifier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Arbitrum](https://img.shields.io/badge/Arbitrum-Stylus-blue.svg)](https://arbitrum.io/)
[![Rust](https://img.shields.io/badge/Rust-WASM-orange.svg)](https://www.rust-lang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-purple.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![circomlib](https://img.shields.io/badge/Poseidon-circomlib%20Compatible-green.svg)](https://github.com/iden3/circomlib)

> **Mini STARK Verifier demonstrating ~2.1x gas savings on Arbitrum Stylus (Rust/WASM) compared to Solidity**

Built for **Arbitrum APAC Mini Hackathon 2026**

---

## Table of Contents

- [Features](#features)
- [Benchmark Results](#benchmark-results)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Contract Deployment](#contract-deployment)
- [Deployed Contracts](#deployed-contracts)
- [Technical Details](#technical-details)
  - [Poseidon Hash Function](#poseidon-hash-function)
  - [Merkle Verification](#merkle-verification)
- [Why Stylus is Faster](#why-stylus-is-faster)
- [Security](#security)
- [API Reference](#api-reference)
- [Supported Wallets](#supported-wallets)
- [Environment Variables](#environment-variables)
- [License](#license)
- [References](#references)

---

## Features

- **~2.1x Gas Savings** - Merkle path verification using Stylus vs Solidity
- **Real-time Gas Dashboard** - Live gas measurement and comparison charts
- **circomlib Compatible** - Poseidon hash function compatible with iden3/circomlib
- **Merkle Proof Verification** - Variable depth support (8, 16, 32)
- **Live on Arbitrum Sepolia** - Both contracts deployed and verifiable
- **Modern Web3 Stack** - Next.js 16 + React 19 + thirdweb v5
- **Multi-wallet Support** - MetaMask, Coinbase, Rabby, WalletConnect

---

## Benchmark Results

Real transaction measurements on Arbitrum Sepolia testnet:

| Depth | Stylus (Rust/WASM) | Solidity (EVM) | Gas Savings |
|-------|-------------------|----------------|-------------|
| 8     | 2.08M gas         | 4.34M gas      | **2.08x**   |
| 16    | 4.11M gas         | 8.66M gas      | **2.11x**   |
| 32    | 8.16M gas         | 17.32M gas     | **2.12x**   |

### Per-Hash Analysis

| Metric | Stylus | Solidity | Ratio |
|--------|--------|----------|-------|
| Gas per Poseidon hash | ~257K | ~541K | 2.1x |
| Single hash call | 300K | 564K | 1.88x |

> **Note**: The consistent ~2.1x ratio across all depths confirms that Stylus maintains its efficiency advantage regardless of workload size.

### 🚀 Impact on Scalability

**Why L2?** Heavy ZK verification on Ethereum Mainnet would consume entire blocks. By offloading to Arbitrum Stylus, we free up valuable L1 block space while inheriting Ethereum's security.

At Depth 32, Solidity consumes **17.32M gas (54% of block limit)**, causing potential network congestion. Stylus consumes only **8.16M gas (25% of block limit)**, making large-scale ZK verification **sustainable**.

| Metric | Solidity | Stylus | Improvement |
|--------|----------|--------|-------------|
| Block Usage (Depth 32) | 54% | 25% | **2.1x more headroom** |
| Max Verifications/Block | ~1.8 | ~3.9 | **2.1x throughput** |

> **L2 Scaling Strategy**: Offload compute-intensive verification to Arbitrum → Settle proofs on Ethereum → Best of both worlds (speed + security)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│        Next.js 16 + React 19 + TypeScript + thirdweb v5         │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │VerifyPanel  │ │GasComparison│ │BenchmarkTbl │ │L2Chart     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Arbitrum Sepolia (L2)                         │
│                      Chain ID: 421614                            │
├────────────────────────────┬────────────────────────────────────┤
│     Stylus Verifier        │       Solidity Verifier            │
│     (Rust → WASM)          │       (Solidity → EVM)             │
│                            │                                     │
│  ┌──────────────────┐      │    ┌──────────────────┐            │
│  │ poseidon_hash()  │      │    │ poseidonHash()   │            │
│  │ verify_merkle()  │      │    │ verifyMerkle()   │            │
│  │ batch_poseidon() │      │    │ batchPoseidon()  │            │
│  └──────────────────┘      │    └──────────────────┘            │
│                            │                                     │
│  0x327c65e0...             │    0x96326E36...                   │
├────────────────────────────┴────────────────────────────────────┤
│                  Poseidon BN254 (t=3)                            │
│            8 Full Rounds + 57 Partial Rounds                     │
│                 circomlib Compatible                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| thirdweb | 5.116.1 | Web3 integration |
| Recharts | 2.15.4 | Data visualization |
| shadcn/ui | - | UI components |
| Radix UI | - | Accessible primitives |

### Stylus Contract (Rust)

| Dependency | Version | Purpose |
|------------|---------|---------|
| stylus-sdk | 0.9.0 | Arbitrum Stylus SDK |
| alloy-primitives | 0.8 | Ethereum types (U256) |
| alloy-sol-types | 0.8 | Solidity type interop |
| ruint | 1.12.3 | Big integer operations |
| mini-alloc | 0.6 | WASM allocator |

### Solidity Contract

| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | ^0.8.24 | Smart contract language |
| Foundry | latest | Development framework |
| forge-std | - | Testing utilities |

---

## Project Structure

```
starkverifier/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main dashboard page
│   ├── providers.tsx            # thirdweb + Gas context
│   └── globals.css              # Tailwind styles
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   └── chart.tsx
│   ├── ConnectWallet.tsx        # Wallet connection button
│   ├── VerifyPanel.tsx          # Main verification UI
│   ├── GasComparison.tsx        # Bar chart visualization
│   ├── BenchmarkTable.tsx       # Detailed benchmark data
│   └── L2ComputationChart.tsx   # L2 computation comparison
│
├── lib/
│   ├── client.ts                # thirdweb client setup
│   ├── chains.ts                # Arbitrum Sepolia config
│   ├── contracts.ts             # Contract addresses & ABI
│   ├── gas-utils.ts             # Gas calculation utilities
│   ├── gas-context.tsx          # React context for gas state
│   └── utils.ts                 # Tailwind merge utility
│
├── contracts/
│   ├── stylus/                  # Rust/WASM implementation
│   │   ├── src/
│   │   │   ├── lib.rs          # Contract entry point
│   │   │   ├── poseidon/
│   │   │   │   ├── mod.rs      # Poseidon hash implementation
│   │   │   │   ├── constants.rs # 195 round constants
│   │   │   │   └── field.rs    # BN254 field arithmetic
│   │   │   └── merkle.rs       # Merkle verification logic
│   │   └── Cargo.toml          # Rust dependencies
│   │
│   └── solidity/                # EVM implementation
│       ├── src/
│       │   ├── StarkVerifier.sol # Main contract
│       │   └── Poseidon.sol      # Poseidon library
│       ├── script/
│       │   └── Deploy.s.sol      # Deployment script
│       ├── test/
│       │   └── Poseidon.t.sol    # Unit tests
│       └── foundry.toml          # Foundry config
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm/yarn
- **Rust** + cargo (for Stylus development)
- **Foundry** (for Solidity development)

### Installation

```bash
# Clone the repository
git clone https://github.com/hoddukzoa12/starkverifier.git
cd starkverifier

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your thirdweb client ID

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

---

## Contract Deployment

### Stylus (Rust)

```bash
# Navigate to Stylus contract directory
cd contracts/stylus

# Check contract validity
cargo stylus check

# Build WASM binary
cargo build --release --target wasm32-unknown-unknown

# Deploy to Arbitrum Sepolia
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

### Solidity

```bash
# Navigate to Solidity contract directory
cd contracts/solidity

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test -vvv

# Deploy to Arbitrum Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast \
  --verify
```

---

## Deployed Contracts

| Contract | Address | Network |
|----------|---------|---------|
| **Stylus Verifier** | [`0x327c65e04215bd5575d60b00ba250ed5dd25a4fc`](https://sepolia.arbiscan.io/address/0x327c65e04215bd5575d60b00ba250ed5dd25a4fc) | Arbitrum Sepolia |
| **Solidity Verifier** | [`0x96326E368b6f2fdA258452ac42B1aC013238f5Ce`](https://sepolia.arbiscan.io/address/0x96326E368b6f2fdA258452ac42B1aC013238f5Ce) | Arbitrum Sepolia |

**Network Details:**
- Chain ID: `421614`
- RPC: `https://sepolia-rollup.arbitrum.io/rpc`
- Explorer: [Arbiscan Sepolia](https://sepolia.arbiscan.io)

---

## Technical Details

### Poseidon Hash Function

The Poseidon hash function is a ZK-friendly hash designed for efficient verification in zero-knowledge proof systems.

#### Specification

| Parameter | Value |
|-----------|-------|
| **Field** | BN254 (alt_bn128) |
| **Prime** | `21888242871839275222246405745257275088548364400416034343698204186575808495617` |
| **Width (t)** | 3 (2 inputs + 1 capacity element) |
| **Full Rounds** | 8 (4 before + 4 after partial) |
| **Partial Rounds** | 57 |
| **Total Rounds** | 65 |
| **S-box** | x^5 (quintic) |
| **MDS Matrix** | 3×3 Cauchy matrix |
| **Round Constants** | 195 (65 rounds × 3 elements) |

#### Round Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Poseidon Permutation                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: [0, a, b]  (capacity element = 0)                   │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  4 Full Rounds  │  ← Add constants, S-box ALL, MDS      │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ 57 Partial Rds  │  ← Add constants, S-box FIRST only    │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  4 Full Rounds  │  ← Add constants, S-box ALL, MDS      │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Output: state[0]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Test Vector (circomlib compatible)

```
Input:  [1, 2]
Output: 0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
```

Both Stylus and Solidity implementations produce identical outputs, verified against [iden3/circomlib](https://github.com/iden3/circomlib).

### Merkle Verification

#### Algorithm

```
verify_merkle_path(root, leaf, path[], indices[]) → bool

1. Validate: path.length == indices.length
2. Initialize: current = leaf
3. For each (sibling, is_right) in zip(path, indices):
   - If is_right (true):  current = hash(sibling, current)
   - If is_right (false): current = hash(current, sibling)
4. Return: current == root
```

#### Example (4-leaf tree)

```
        root
       /    \
     h01    h23
    /  \   /  \
   L0  L1 L2  L3

Proof for L0:
  - path:    [L1, h23]
  - indices: [false, false]

Computation:
  h01  = hash(L0, L1)     // L0 is left child
  root = hash(h01, h23)   // h01 is left child
```

#### Supported Depths

| Depth | Leaves | Hash Operations | Use Case |
|-------|--------|-----------------|----------|
| 8 | 256 | 8 | Small datasets |
| 16 | 65,536 | 16 | Medium datasets |
| 32 | 4.3B | 32 | Large-scale applications |

---

## Why Stylus is Faster

### EVM vs WASM Comparison

| Aspect | EVM (Solidity) | WASM (Stylus) | Impact |
|--------|----------------|---------------|--------|
| **Register Size** | 256-bit stack | 64-bit registers | 4x smaller operations |
| **Loop Overhead** | Gas metering per iteration | Native loops | No per-iteration cost |
| **Memory Access** | Expensive MLOAD/MSTORE | Linear memory model | Faster data access |
| **Arithmetic** | mulmod/addmod opcodes | Native 64-bit ops | Hardware acceleration |
| **Call Overhead** | High context switch cost | Minimal overhead | Cheaper function calls |

### Detailed Analysis

#### 1. Native 64-bit Arithmetic
EVM operates on 256-bit integers, requiring multiple CPU cycles for basic operations. Stylus uses native 64-bit arithmetic, leveraging hardware optimizations.

```
256-bit multiplication (EVM):
  - Multiple 64-bit multiplications
  - Manual carry propagation
  - ~8 CPU cycles per operation

64-bit multiplication (WASM):
  - Single CPU instruction
  - Hardware optimization
  - ~1 CPU cycle per operation
```

#### 2. Efficient Loop Execution
EVM charges gas for every instruction, including loop management. WASM executes loops natively without per-iteration overhead.

```solidity
// Solidity: Gas charged for each iteration
for (uint i = 0; i < 57; i++) {
    // ~200 gas overhead per iteration
    state = partialRound(state);
}
```

```rust
// Stylus: Native loop execution
for i in 0..57 {
    // Zero overhead for loop management
    state = partial_round(state);
}
```

#### 3. Memory Model
EVM's memory expansion has quadratic cost growth. WASM uses a linear memory model with predictable costs.

---

## Security

### 🔐 Cryptographic Verification

Our Poseidon implementation is **verified against industry-standard test vectors** from [iden3/circomlib](https://github.com/iden3/circomlib), the most widely-used ZK library in production.

#### Test Vector Verification

```rust
// Official circomlib test vector
poseidon([1, 2]) = 0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
```

| Verification | Status |
|--------------|--------|
| circomlib test vector match | ✅ **Passed** |
| BN254 field arithmetic | ✅ **Verified** |
| Round constants (195 values) | ✅ **Matches circomlib** |
| MDS matrix | ✅ **Matches circomlib** |

#### Implementation Audit Checklist

| Component | Implementation | Security Status |
|-----------|---------------|-----------------|
| Field Prime | BN254 (alt_bn128) | ✅ Standard curve |
| S-box | x^5 | ✅ Proven secure |
| Rounds | 8 full + 57 partial | ✅ Matches spec |
| Width | t=3 (2 inputs + capacity) | ✅ Standard config |

### 🛡️ Smart Contract Security

- **No external calls** - Pure computation, no reentrancy risk
- **No storage manipulation** - Only verification state stored
- **Deterministic execution** - Same inputs always produce same outputs
- **No owner privileges** - Fully permissionless verification

### ⚠️ Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Testnet L1 gas = 0 | L1/L2 breakdown unavailable on Sepolia | Mainnet returns actual values |
| No formal audit | Not production-ready | Use circomlib for production |

> **Note**: This implementation is designed for demonstration and benchmarking purposes. For production ZK applications, use audited libraries like [circomlib](https://github.com/iden3/circomlib) or [arkworks](https://github.com/arkworks-rs).

---

## API Reference

### Contract Interface

Both contracts implement the same interface for fair comparison:

```solidity
interface IStarkVerifier {
    /// @notice Compute Poseidon hash of two field elements
    /// @param a First input element
    /// @param b Second input element
    /// @return hash The Poseidon hash result
    function poseidonHash(uint256 a, uint256 b)
        external pure returns (uint256 hash);

    /// @notice Batch compute multiple Poseidon hashes
    /// @param inputsA Array of first elements
    /// @param inputsB Array of second elements
    /// @return hashes Array of hash results
    function batchPoseidon(
        uint256[] calldata inputsA,
        uint256[] calldata inputsB
    ) external pure returns (uint256[] memory hashes);

    /// @notice Verify a Merkle proof
    /// @param root Expected Merkle root
    /// @param leaf Leaf value to verify
    /// @param path Sibling hashes along the path
    /// @param indices Position indicators (false=left, true=right)
    /// @return valid True if proof is valid
    function verifyMerklePath(
        uint256 root,
        uint256 leaf,
        uint256[] calldata path,
        bool[] calldata indices
    ) external returns (bool valid);

    /// @notice Get the last verification result
    /// @return root Last verified root
    /// @return result Last verification result
    function getLastResult()
        external view returns (uint256 root, bool result);

    /// @notice Get total verification count
    /// @return count Number of verifications performed
    function getVerificationCount()
        external view returns (uint256 count);

    /// @notice Benchmark N sequential hashes
    /// @param iterations Number of hash iterations
    /// @param seedA First seed value
    /// @param seedB Second seed value
    /// @return result Final hash after all iterations
    function benchmarkHash(
        uint32 iterations,
        uint256 seedA,
        uint256 seedB
    ) external pure returns (uint256 result);

    /// @notice Emitted when a Merkle proof is verified
    event MerkleVerified(
        uint256 indexed root,
        uint256 leaf,
        bool result
    );
}
```

### JavaScript/TypeScript Usage

```typescript
import { prepareContractCall, sendTransaction } from "thirdweb";
import { getStylusContract, generateTestProof } from "@/lib/contracts";

// Get contract instance
const contract = getStylusContract();

// Generate test proof
const { root, leaf, path, indices } = generateTestProof(8);

// Prepare and send transaction
const tx = prepareContractCall({
  contract,
  method: "verifyMerklePath",
  params: [root, leaf, path, indices],
});

const result = await sendTransaction(tx);
console.log("Gas used:", result.receipt.gasUsed);
```

---

## Supported Wallets

The application supports multiple wallets through thirdweb:

| Wallet | Status | Notes |
|--------|--------|-------|
| MetaMask | Supported | Browser extension |
| Coinbase Wallet | Supported | Browser & mobile |
| Rabby | Supported | Multi-chain wallet |
| WalletConnect | Supported | QR code connection |

---

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required: thirdweb client ID
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Optional: For contract deployment
PRIVATE_KEY=your_private_key_for_deployment
```

### Getting a thirdweb Client ID

1. Go to [thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project
3. Copy the Client ID
4. Add to `.env.local`

---

## Testing

### Solidity Tests

```bash
cd contracts/solidity

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_CircomlibCompatibility

# Gas report
forge test --gas-report
```

### Stylus Tests

```bash
cd contracts/stylus

# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture
```

---

## Gas Optimization Details

### Why ~2x Instead of 18x?

[OpenZeppelin achieved 18x](https://blog.openzeppelin.com/porting-contracts-to-stylus) using **hand-optimized Montgomery arithmetic** - complex low-level code that requires cryptography expertise to write and maintain.

**Our approach is different: We prioritized accessibility.**

| Approach | Performance | Accessibility | Maintainability |
|----------|-------------|---------------|-----------------|
| OZ (Montgomery) | 18x | ❌ Expert only | ❌ Complex |
| **Ours (Standard libs)** | **2.1x** | ✅ Any developer | ✅ Clean code |

> **Key Insight**: We achieved **2.1x improvement using standard, safe Rust libraries**. This proves that **any developer**—not just cryptographers—can immediately double their app's efficiency by switching to Stylus, without sacrificing code safety or readability.

### The Real-World Value

```
OpenZeppelin's 18x = Theoretical ceiling (requires PhD-level optimization)
Our 2.1x = Practical floor (achievable with `cargo add`)
```

| Metric | OZ Approach | Our Approach |
|--------|-------------|--------------|
| Lines of Montgomery code | ~500+ | 0 |
| Time to implement | Weeks | Hours |
| Audit complexity | High | Low |
| Production readiness | Requires expert review | Standard library backed |

**For the Ethereum ecosystem, a stable 2x that works today is more valuable than a theoretical 18x that requires months of specialized development.**

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## References

- [Arbitrum Stylus Documentation](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [circomlib Poseidon](https://github.com/iden3/circomlib)
- [poseidon-rs](https://github.com/arnaucube/poseidon-rs)
- [OpenZeppelin Stylus Benchmark](https://blog.openzeppelin.com/introducing-openzeppelin-contracts-for-stylus)
- [thirdweb Documentation](https://portal.thirdweb.com/)
- [Foundry Book](https://book.getfoundry.sh/)

---

## Acknowledgments

- **Arbitrum Team** - For creating Stylus and enabling WASM smart contracts
- **iden3** - For the circomlib Poseidon implementation reference
- **OpenZeppelin** - For Stylus benchmarking methodology
- **thirdweb** - For the excellent Web3 development tools

---

<p align="center">
  Built with for <strong>Arbitrum APAC Mini Hackathon 2026</strong>
</p>
