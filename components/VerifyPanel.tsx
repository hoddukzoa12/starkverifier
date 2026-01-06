"use client";

import { useState, useRef, useCallback } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useSendTransaction,
} from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getStylusContract,
  getSolidityContract,
  generateTestProof,
  type VerifierType,
  type VerificationResult,
} from "@/lib/contracts";
import { client } from "@/lib/client";
import { arbitrumSepolia } from "@/lib/chains";
import { useGas } from "@/lib/gas-context";
import { getArbitrumReceiptWithL1Gas, calculateActualL2 } from "@/lib/gas-utils";
import { toast } from "@/components/ui/sonner";
import { Loader2, CheckCircle2, XCircle, Zap, Code2, Fuel, AlertCircle } from "lucide-react";

type MerkleDepth = 8 | 16 | 32;

export function VerifyPanel() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const connectionStatus = useActiveWalletConnectionStatus();
  const [depth, setDepth] = useState<MerkleDepth>(8);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isLoading, setIsLoading] = useState<VerifierType | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Use ref to keep stable reference to account address
  const accountRef = useRef(account?.address);
  accountRef.current = account?.address;

  const { mutateAsync: sendTransaction } = useSendTransaction();
  const { addMeasurement, getLatestGas, getSavingsRatio } = useGas();

  // Helper to check if wallet is ready
  const isWalletReady = useCallback(() => {
    return connectionStatus === "connected" && account?.address && wallet;
  }, [connectionStatus, account?.address, wallet]);

  // Helper to wait for wallet to be ready
  const waitForWallet = async (maxWait = 3000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      if (accountRef.current) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  };

  const runVerification = async (type: VerifierType) => {
    setConnectionError(null);

    // Only do a basic check - don't be too aggressive
    // The wallet might report "unknown" status during transactions
    if (!account?.address && connectionStatus === "disconnected") {
      setConnectionError("Wallet not connected. Please reconnect.");
      return;
    }

    setIsLoading(type);
    const contract = type === "stylus" ? getStylusContract() : getSolidityContract();
    const { root, leaf, path, indices } = generateTestProof(depth);

    try {
      const tx = prepareContractCall({
        contract,
        method: "verifyMerklePath",
        params: [root, leaf, path, indices],
      } as Parameters<typeof prepareContractCall>[0]);

      const txResult = await sendTransaction(tx);

      // Wait for receipt to get actual gas used
      const receipt = await waitForReceipt({
        client,
        chain: arbitrumSepolia,
        transactionHash: txResult.transactionHash,
      });

      const gasUsed = receipt.gasUsed;

      // Fetch Arbitrum-specific receipt with L1 gas breakdown
      let l1DataGas: bigint | undefined;
      let l2Computation: bigint | undefined;

      try {
        console.log(`[${type}] Fetching Arbitrum receipt for L1 gas...`, txResult.transactionHash);
        const arbReceipt = await getArbitrumReceiptWithL1Gas(txResult.transactionHash);
        console.log(`[${type}] Arbitrum receipt:`, arbReceipt);

        // Check if gasUsedForL1 is present AND greater than 0
        // On Arbitrum Sepolia testnet, gasUsedForL1 may return 0
        if (arbReceipt?.gasUsedForL1 !== undefined && arbReceipt.gasUsedForL1 > BigInt(0)) {
          const breakdown = calculateActualL2(gasUsed, arbReceipt.gasUsedForL1);
          l1DataGas = breakdown.l1Gas;
          l2Computation = breakdown.l2Gas;
          console.log(`[${type}] Actual L1/L2 breakdown from receipt:`, {
            total: gasUsed.toString(),
            l1: l1DataGas.toString(),
            l2: l2Computation.toString(),
            l1Percent: ((Number(l1DataGas) / Number(gasUsed)) * 100).toFixed(1) + "%",
          });
        } else {
          // Testnet returns gasUsedForL1: 0, will use calculated values from context
          console.log(`[${type}] gasUsedForL1 is 0 (testnet), will use calculated L1/L2 breakdown`);
        }
      } catch (err) {
        console.error("Failed to fetch Arbitrum L1 gas info:", err);
        // Non-critical error, just log it - don't show toast for this
      }

      // Add to gas context for charts
      addMeasurement({
        type,
        depth,
        gasUsed,
        l1DataGas,
        l2Computation,
        txHash: txResult.transactionHash,
        timestamp: Date.now(),
      });

      // Show success toast
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} Verification Complete`, {
        description: `Gas used: ${Number(gasUsed).toLocaleString()}`,
      });

      // Add result to history
      setResults((prev) => [
        {
          type,
          success: true,
          gasUsed,
          txHash: txResult.transactionHash,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (error: unknown) {
      // Extract error message from various error formats
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle thirdweb error objects
        const errObj = error as Record<string, unknown>;
        if (typeof errObj.message === "string") {
          errorMessage = errObj.message;
        } else if (typeof errObj.reason === "string") {
          errorMessage = errObj.reason;
        } else if (typeof errObj.shortMessage === "string") {
          errorMessage = errObj.shortMessage;
        } else if (typeof errObj.cause === "object" && errObj.cause !== null) {
          const cause = errObj.cause as Record<string, unknown>;
          if (typeof cause.message === "string") {
            errorMessage = cause.message;
          } else if (typeof cause.shortMessage === "string") {
            errorMessage = cause.shortMessage;
          }
        } else {
          // Try to stringify if nothing else works
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "Transaction failed (see console for details)";
          }
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      console.error(`${type} verification failed:`, error);
      console.error("Error message extracted:", errorMessage);

      // Check for specific error types and show toast
      if (errorMessage.includes("No active account") || errorMessage.includes("disconnected")) {
        setConnectionError("Wallet disconnected during transaction. Please reconnect and try again.");
        toast.error("Wallet Disconnected", {
          description: "Please reconnect your wallet and try again.",
        });
      } else if (errorMessage.toLowerCase().includes("rate limit") || errorMessage.includes("429")) {
        setConnectionError("RPC rate limited. Please wait a few seconds and try again.");
        toast.error("Rate Limited", {
          description: "RPC rate limit exceeded. Please wait a few seconds and retry.",
        });
      } else if (errorMessage.includes("rejected") || errorMessage.includes("denied")) {
        setConnectionError("Transaction was rejected by user.");
        toast.warning("Transaction Rejected", {
          description: "You rejected the transaction in your wallet.",
        });
      } else if (errorMessage.includes("insufficient funds") || errorMessage.includes("gas")) {
        toast.error("Insufficient Funds", {
          description: "You may not have enough ETH for gas fees.",
        });
      } else {
        toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} Verification Failed`, {
          description: errorMessage.slice(0, 100),
        });
      }

      setResults((prev) => [
        {
          type,
          success: false,
          gasUsed: BigInt(0),
          txHash: "",
          timestamp: Date.now(),
          error: errorMessage.slice(0, 100), // Store truncated error
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setIsLoading(null);
    }
  };

  const runComparison = async () => {
    setConnectionError(null);
    setIsComparing(true);

    try {
      // Run Stylus verification first
      await runVerification("stylus");

      // Wait longer to avoid RPC rate limiting (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Run Solidity verification - trust that wallet is still connected
      // since first transaction succeeded. Let actual errors be caught in try-catch.
      await runVerification("solidity");
    } finally {
      setIsComparing(false);
    }
  };

  // Get latest measurements for current depth
  const latestStylusGas = getLatestGas("stylus", depth);
  const latestSolidityGas = getLatestGas("solidity", depth);
  const currentSavings = getSavingsRatio(depth);

  if (!account) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Connect your wallet to verify Merkle proofs and compare gas costs between Stylus and Solidity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Merkle Proof Verification
        </CardTitle>
        <CardDescription>
          Compare gas costs between Stylus (Rust) and Solidity implementations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Error Alert */}
        {connectionError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{connectionError}</span>
          </div>
        )}

        {/* Connection Status Indicator - only show for actual disconnection */}
        {connectionStatus === "disconnected" && !account?.address && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Wallet disconnected. Please reconnect to continue.
            </span>
          </div>
        )}

        {/* Depth Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Merkle Tree Depth</label>
          <Tabs
            value={depth.toString()}
            onValueChange={(v) => setDepth(parseInt(v) as MerkleDepth)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="8">Depth 8</TabsTrigger>
              <TabsTrigger value="16">Depth 16</TabsTrigger>
              <TabsTrigger value="32">Depth 32</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Higher depth = more hash operations = bigger gas difference
          </p>
        </div>

        {/* Live Gas Stats */}
        {(latestStylusGas || latestSolidityGas) && (
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Stylus</div>
              <div className="font-mono text-sm text-orange-500">
                {latestStylusGas ? Number(latestStylusGas).toLocaleString() : "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Solidity</div>
              <div className="font-mono text-sm text-purple-500">
                {latestSolidityGas ? Number(latestSolidityGas).toLocaleString() : "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Savings</div>
              <div className="font-mono text-sm text-green-500 font-bold">
                {currentSavings || "-"}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => runVerification("stylus")}
            disabled={isLoading !== null || isComparing || (connectionStatus === "disconnected" && !account?.address)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading === "stylus" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Stylus (Rust)
          </Button>
          <Button
            onClick={() => runVerification("solidity")}
            disabled={isLoading !== null || isComparing || (connectionStatus === "disconnected" && !account?.address)}
            variant="secondary"
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isLoading === "solidity" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Code2 className="mr-2 h-4 w-4" />
            )}
            Solidity
          </Button>
        </div>

        <Button
          onClick={runComparison}
          disabled={isLoading !== null || isComparing || (connectionStatus === "disconnected" && !account?.address)}
          variant="outline"
          className="w-full"
        >
          {isComparing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoading === "stylus"
                ? "Running Stylus..."
                : isLoading === "solidity"
                  ? "Running Solidity..."
                  : "Waiting (rate limit)..."}
            </>
          ) : (
            "Run Comparison (Both)"
          )}
        </Button>

        {/* Results History */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Results</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={`${r.timestamp}-${i}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={r.type === "stylus" ? "default" : "secondary"}
                      className={
                        r.type === "stylus"
                          ? "bg-orange-500"
                          : "bg-purple-500 text-white"
                      }
                    >
                      {r.type.toUpperCase()}
                    </Badge>
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {r.gasUsed > 0 && (
                      <span className="text-xs font-mono flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        {Number(r.gasUsed).toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      {r.txHash ? `${r.txHash.slice(0, 10)}...` : "Failed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
