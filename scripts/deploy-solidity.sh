#!/bin/bash
set -e

# STARK Solidity Verifier - Foundry Deployment Script
# Arbitrum Sepolia Testnet

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOLIDITY_DIR="$PROJECT_ROOT/contracts/solidity"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  STARK Solidity Verifier - Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
RPC_ENDPOINT="${RPC_ENDPOINT:-https://sepolia-rollup.arbitrum.io/rpc}"

# Load from .env.local if exists
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}Loading configuration from .env.local...${NC}"
    set -a
    source "$ENV_FILE"
    set +a
fi

# Check for private key
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not found in .env.local${NC}"
    echo -e "${YELLOW}Add to .env.local:${NC}"
    echo "PRIVATE_KEY=0x..."
    exit 1
fi

# Export for Foundry
export PRIVATE_KEY

# Check forge installation
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry (forge) not installed.${NC}"
    echo "Install with: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
fi

# Navigate to Solidity contract directory
cd "$SOLIDITY_DIR"

echo -e "${BLUE}Installing dependencies...${NC}"
forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>/dev/null || true

echo ""
echo -e "${BLUE}Building contracts...${NC}"
forge build

echo ""
echo -e "${BLUE}Deploying to Arbitrum Sepolia...${NC}"
echo -e "${YELLOW}RPC: $RPC_ENDPOINT${NC}"
echo ""

# Deploy
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$RPC_ENDPOINT" \
    --broadcast \
    --verify \
    2>&1) || DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$RPC_ENDPOINT" \
    --broadcast \
    2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Contract Address: ${CONTRACT_ADDRESS}${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Update lib/contracts.ts with:"
    echo -e "   SOLIDITY_VERIFIER_ADDRESS = \"${CONTRACT_ADDRESS}\""
    echo ""
    echo -e "2. View on explorer:"
    echo -e "   https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}"

    # Save to file
    echo "$CONTRACT_ADDRESS" > "$PROJECT_ROOT/solidity-address.txt"
    echo -e "${BLUE}Address saved to solidity-address.txt${NC}"
fi
