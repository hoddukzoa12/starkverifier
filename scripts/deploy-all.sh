#!/bin/bash
set -e

# STARK Verifier - Combined Deployment Script
# Deploys both Stylus and Solidity contracts to Arbitrum Sepolia

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STARK Verifier - Full Deployment Suite    ║${NC}"
echo -e "${CYAN}║  Arbitrum Sepolia Testnet                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Load from .env.local
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}Loading configuration from .env.local...${NC}"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo -e "${RED}Error: .env.local not found${NC}"
    echo -e "${YELLOW}Create .env.local with:${NC}"
    echo "PRIVATE_KEY=0x..."
    exit 1
fi

# Check for private key
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not found in .env.local${NC}"
    exit 1
fi

export PRIVATE_KEY

echo ""
echo -e "${BLUE}[1/2] Deploying Stylus Contract...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash "$SCRIPT_DIR/deploy-stylus.sh"

STYLUS_ADDRESS=""
if [ -f "$PROJECT_ROOT/stylus-address.txt" ]; then
    STYLUS_ADDRESS=$(cat "$PROJECT_ROOT/stylus-address.txt")
fi

echo ""
echo -e "${BLUE}[2/2] Deploying Solidity Contract...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash "$SCRIPT_DIR/deploy-solidity.sh"

SOLIDITY_ADDRESS=""
if [ -f "$PROJECT_ROOT/solidity-address.txt" ]; then
    SOLIDITY_ADDRESS=$(cat "$PROJECT_ROOT/solidity-address.txt")
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  All Contracts Deployed Successfully!      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Contract Addresses:${NC}"
echo -e "  Stylus:   ${STYLUS_ADDRESS:-Not captured}"
echo -e "  Solidity: ${SOLIDITY_ADDRESS:-Not captured}"
echo ""
echo -e "${YELLOW}Update lib/contracts.ts:${NC}"
echo ""
echo "export const STYLUS_VERIFIER_ADDRESS ="
echo "  \"${STYLUS_ADDRESS:-0x...}\" as const;"
echo ""
echo "export const SOLIDITY_VERIFIER_ADDRESS ="
echo "  \"${SOLIDITY_ADDRESS:-0x...}\" as const;"
echo ""
echo -e "${BLUE}Explorer Links:${NC}"
if [ -n "$STYLUS_ADDRESS" ]; then
    echo -e "  Stylus:   https://sepolia.arbiscan.io/address/${STYLUS_ADDRESS}"
fi
if [ -n "$SOLIDITY_ADDRESS" ]; then
    echo -e "  Solidity: https://sepolia.arbiscan.io/address/${SOLIDITY_ADDRESS}"
fi
