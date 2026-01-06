"use client";

import { Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Zap, ExternalLink, Radio, Activity, Layers } from "lucide-react";
import { useGas, type GasMeasurement } from "@/lib/gas-context";
import { formatGas } from "@/lib/gas-utils";

interface BenchmarkRow {
  operation: string;
  stylusGas: number;
  solidityGas: number;
  savings: string;
  source?: string;
}

const benchmarks: BenchmarkRow[] = [
  {
    operation: "Poseidon Hash (single)",
    stylusGas: 11887,
    solidityGas: 220244,
    savings: "18.5x",
    source: "OpenZeppelin 2025",
  },
  {
    operation: "Merkle Verify (depth 8)",
    stylusGas: 13000,
    solidityGas: 240000,
    savings: "18x",
  },
  {
    operation: "Merkle Verify (depth 16)",
    stylusGas: 26000,
    solidityGas: 480000,
    savings: "18x",
  },
  {
    operation: "Merkle Verify (depth 32)",
    stylusGas: 52000,
    solidityGas: 960000,
    savings: "18x",
  },
  {
    operation: "Batch Poseidon (10 hashes)",
    stylusGas: 118870,
    solidityGas: 2202440,
    savings: "18.5x",
  },
];

const projectedFullVerifier: BenchmarkRow[] = [
  {
    operation: "Poseidon hashes (full verifier)",
    stylusGas: 160000,
    solidityGas: 3000000,
    savings: "18x",
  },
  {
    operation: "Field arithmetic",
    stylusGas: 100000,
    solidityGas: 1000000,
    savings: "10x",
  },
  {
    operation: "Merkle paths",
    stylusGas: 52000,
    solidityGas: 960000,
    savings: "18x",
  },
  {
    operation: "Full STARK Verifier (projected)",
    stylusGas: 312000,
    solidityGas: 5000000,
    savings: "~16x",
  },
];

// Helper to calculate savings
function calculateSavings(stylusGas: bigint, solidityGas: bigint): string {
  if (stylusGas === BigInt(0)) return "-";
  const ratio = Number(solidityGas) / Number(stylusGas);
  return `${ratio.toFixed(1)}x`;
}

export function BenchmarkTable() {
  const { measurements, getL2Breakdown } = useGas();

  // Get recent measurements grouped by depth
  const recentByDepth = measurements.reduce((acc, m) => {
    if (!acc[m.depth]) {
      acc[m.depth] = { stylus: null, solidity: null };
    }
    if (m.type === "stylus" && !acc[m.depth].stylus) {
      acc[m.depth].stylus = m;
    }
    if (m.type === "solidity" && !acc[m.depth].solidity) {
      acc[m.depth].solidity = m;
    }
    return acc;
  }, {} as Record<number, { stylus: GasMeasurement | null; solidity: GasMeasurement | null }>);

  // Build live benchmark rows from actual measurements
  const liveBenchmarks = Object.entries(recentByDepth)
    .filter(([, data]) => data.stylus || data.solidity)
    .map(([depth, data]) => {
      const depthNum = Number(depth);
      const stylusGas = data.stylus?.gasUsed || BigInt(0);
      const solidityGas = data.solidity?.gasUsed || BigInt(0);
      const breakdown = getL2Breakdown(depthNum);

      // Use actual L1/L2 from individual measurements if available
      // Fall back to breakdown calculation if both exist
      const stylusL1 = data.stylus?.l1DataGas ?? breakdown?.stylusL1;
      const stylusL2 = data.stylus?.l2Computation ?? breakdown?.stylusL2;
      const solidityL1 = data.solidity?.l1DataGas ?? breakdown?.solidityL1;
      const solidityL2 = data.solidity?.l2Computation ?? breakdown?.solidityL2;

      // Check if we have actual L1 data from receipts
      const hasActualL1 = data.stylus?.l1DataGas !== undefined || data.solidity?.l1DataGas !== undefined;

      // Calculate L1 percentage from available data
      const stylusL1Pct = stylusL1 && stylusGas > 0
        ? (Number(stylusL1) / Number(stylusGas)) * 100
        : breakdown?.stylusL1Percentage;

      return {
        depth: depthNum,
        operation: `Merkle Verify (depth ${depth})`,
        stylusGas: Number(stylusGas),
        solidityGas: Number(solidityGas),
        savings: stylusGas > 0 && solidityGas > 0 ? calculateSavings(stylusGas, solidityGas) : "-",
        stylusTxHash: data.stylus?.txHash,
        solidityTxHash: data.solidity?.txHash,
        timestamp: Math.max(data.stylus?.timestamp || 0, data.solidity?.timestamp || 0),
        // L1/L2 breakdown - use direct values from measurements
        stylusL1,
        solidityL1,
        stylusL2,
        solidityL2,
        l2Ratio: breakdown?.l2Ratio,
        stylusL1Percentage: stylusL1Pct,
        solidityL1Percentage: breakdown?.solidityL1Percentage,
        isActual: hasActualL1,
      };
    })
    .sort((a, b) => a.depth - b.depth);

  const hasLiveData = liveBenchmarks.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Benchmark Results
          {hasLiveData && (
            <Badge variant="default" className="bg-green-500 ml-2 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Live Data
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasLiveData
            ? "Real-time gas measurements from your transactions"
            : "Detailed gas measurements comparing Stylus vs Solidity implementations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Measurements Section with L1/L2 Breakdown */}
        {hasLiveData && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
              Your Transaction Results
              {liveBenchmarks.some((b) => b.isActual) && (
                <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                  Actual L1 Data
                </Badge>
              )}
            </h4>

            {/* Gas Breakdown Table */}
            <div className="rounded-lg border border-green-500/30 overflow-hidden bg-green-500/5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Depth</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                    <TableHead className="text-right">Total Gas</TableHead>
                    <TableHead className="text-right text-blue-400">L1 Data</TableHead>
                    <TableHead className="text-right text-cyan-400">L2 Compute</TableHead>
                    <TableHead className="text-right text-green-500">Savings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveBenchmarks.map((row) => (
                    <Fragment key={row.depth}>
                      {/* Stylus Row */}
                      <TableRow className="border-b-0">
                        <TableCell rowSpan={2} className="font-medium align-middle">
                          {row.depth}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-orange-500">Stylus</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.stylusGas > 0 ? (
                            <a
                              href={`https://sepolia.arbiscan.io/tx/${row.stylusTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-orange-500"
                            >
                              {formatGas(row.stylusGas)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-400">
                          {row.stylusL1 ? formatGas(row.stylusL1) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-cyan-400">
                          {row.stylusL2 ? formatGas(row.stylusL2) : "-"}
                        </TableCell>
                        <TableCell rowSpan={2} className="text-right align-middle">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                              {row.savings}
                            </Badge>
                            {row.l2Ratio && (
                              <>
                                <div className="text-xs text-muted-foreground mt-2">L2 Only</div>
                                <Badge className="bg-green-500">
                                  {row.l2Ratio.toFixed(1)}x
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Solidity Row */}
                      <TableRow>
                        <TableCell className="text-right">
                          <Badge className="bg-purple-500">Solidity</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.solidityGas > 0 ? (
                            <a
                              href={`https://sepolia.arbiscan.io/tx/${row.solidityTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-purple-500"
                            >
                              {formatGas(row.solidityGas)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-400">
                          {row.solidityL1 ? formatGas(row.solidityL1) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-cyan-400">
                          {row.solidityL2 ? formatGas(row.solidityL2) : "-"}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Explanation Box */}
            {liveBenchmarks.some((b) => b.stylusL1) && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h5 className="font-semibold text-sm flex items-center gap-2">
                      Why Total shows ~1.1x but L2 shows different?
                      {liveBenchmarks.some((b) => b.isActual) && (
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                          Real Data
                        </Badge>
                      )}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      On Arbitrum, <span className="text-blue-400 font-medium">most gas goes to L1 data posting</span> (calldata to Ethereum).
                      {liveBenchmarks[0]?.stylusL1Percentage && (
                        <span className="text-blue-400 font-medium">
                          {" "}({liveBenchmarks[0].stylusL1Percentage.toFixed(0)}% of total)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The real savings are in the <span className="text-cyan-400 font-medium">L2 computation</span>, where
                      Stylus (Rust/WASM) shows significant efficiency gains over the EVM!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expected Benchmarks */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Badge variant="secondary">Expected</Badge>
            Mini STARK Verifier
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead className="text-right text-orange-500">Stylus</TableHead>
                  <TableHead className="text-right text-purple-500">Solidity</TableHead>
                  <TableHead className="text-right text-green-500">Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {row.operation}
                      {row.source && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({row.source})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-500">
                      {row.stylusGas.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-purple-500">
                      {row.solidityGas.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        {row.savings}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Projected Full Verifier */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Badge variant="secondary">Projected</Badge>
            Full STARK Verifier
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right text-orange-500">Stylus</TableHead>
                  <TableHead className="text-right text-purple-500">Solidity</TableHead>
                  <TableHead className="text-right text-green-500">Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectedFullVerifier.map((row, i) => (
                  <TableRow
                    key={i}
                    className={
                      row.operation.includes("Full") ? "bg-muted/50 font-semibold" : ""
                    }
                  >
                    <TableCell className="font-medium">{row.operation}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500">
                      {row.stylusGas.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-purple-500">
                      {row.solidityGas.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={row.operation.includes("Full") ? "default" : "outline"}
                        className={
                          row.operation.includes("Full")
                            ? "bg-green-500"
                            : "text-green-500 border-green-500"
                        }
                      >
                        {row.savings}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary Card */}
        <div className={`rounded-lg border p-4 ${
          hasLiveData
            ? "bg-gradient-to-r from-green-500/15 via-orange-500/10 to-purple-500/10 border-green-500/30"
            : "bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-green-500/10"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                {hasLiveData ? "Your Measured Savings" : "Average Gas Savings"}
                {hasLiveData && <Radio className="h-3 w-3 text-green-500 animate-pulse" />}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {hasLiveData
                  ? "Based on your actual transaction measurements"
                  : "Stylus delivers consistent 10-18x improvements for crypto operations"}
              </p>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
              {(() => {
                if (!hasLiveData) return "~18x";
                const validSavings = liveBenchmarks
                  .filter((b) => b.savings !== "-")
                  .map((b) => parseFloat(b.savings));
                if (validSavings.length === 0) return "~18x";
                const avg = validSavings.reduce((a, b) => a + b, 0) / validSavings.length;
                return `${avg.toFixed(1)}x`;
              })()}
            </div>
          </div>
        </div>

        {/* Source Link */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          <span>Based on </span>
          <a
            href="https://www.openzeppelin.com/news/poseidon-go-brr-with-stylus-cryptographic-functions-are-18x-more-gas-efficient-via-rust-on-arbitrum"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            OpenZeppelin Stylus Benchmark (2025)
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
