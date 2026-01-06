#!/bin/bash
set -e

# STARK Stylus Verifier - Stylus Deployment Script
# Arbitrum Sepolia Testnet

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STYLUS_DIR="$PROJECT_ROOT/contracts/stylus"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  STARK Stylus Verifier - Deployment${NC}"
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

# Validate private key format
if [[ ! "$PRIVATE_KEY" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
    echo -e "${RED}Error: Invalid private key format. Must be 0x followed by 64 hex characters.${NC}"
    exit 1
fi

# Check cargo-stylus installation
if ! command -v cargo-stylus &> /dev/null; then
    echo -e "${YELLOW}cargo-stylus not found. Installing...${NC}"
    cargo install cargo-stylus
fi

# Check WASM target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo -e "${YELLOW}Adding wasm32-unknown-unknown target...${NC}"
    rustup target add wasm32-unknown-unknown
fi

# Navigate to Stylus contract directory
cd "$STYLUS_DIR"

echo -e "${BLUE}Building Stylus contract...${NC}"
cargo build --release --target wasm32-unknown-unknown

echo ""
echo -e "${BLUE}Checking contract validity...${NC}"
cargo stylus check \
    --endpoint="$RPC_ENDPOINT"

echo ""
echo -e "${BLUE}Deploying to Arbitrum Sepolia...${NC}"
echo -e "${YELLOW}RPC: $RPC_ENDPOINT${NC}"
echo ""

# Deploy and capture output
DEPLOY_OUTPUT=$(cargo stylus deploy \
    --endpoint="$RPC_ENDPOINT" \
    --private-key="$PRIVATE_KEY" \
    2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address from output
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
    echo -e "   STYLUS_VERIFIER_ADDRESS = \"${CONTRACT_ADDRESS}\""
    echo ""
    echo -e "2. View on explorer:"
    echo -e "   https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}"

    # Save to file for reference
    echo "$CONTRACT_ADDRESS" > "$PROJECT_ROOT/stylus-address.txt"
    echo -e "${BLUE}Address saved to stylus-address.txt${NC}"
else
    echo -e "${RED}Could not extract contract address from deployment output${NC}"
    exit 1
fi
