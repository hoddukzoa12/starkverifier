"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGas } from "@/lib/gas-context";
import { formatGas } from "@/lib/gas-utils";
import { Cpu, Zap, Info, Radio } from "lucide-react";

const DEPTHS = [8, 16, 32] as const;

export function L2ComputationChart() {
  const { getL2Breakdown } = useGas();

  // Check if we have breakdown data
  const breakdowns = DEPTHS.map((depth) => ({
    depth,
    breakdown: getL2Breakdown(depth),
  })).filter((item) => item.breakdown !== null);

  const hasLiveData = breakdowns.length > 0;

  if (!hasLiveData) {
    return null; // Don't show if no data
  }

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          Pure L2 Computation Comparison
          <Badge variant="default" className="bg-cyan-500 ml-2 flex items-center gap-1">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </Badge>
        </CardTitle>
        <CardDescription>
          Actual L2 computation gas from Arbitrum receipts (L1 data cost excluded)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Chart Visualization */}
        <div className="space-y-6">
          {breakdowns.map(({ depth, breakdown }) => {
            if (!breakdown) return null;

            const maxGas = Math.max(
              Number(breakdown.solidityL2),
              Number(breakdown.stylusL2)
            );
            const stylusWidth = (Number(breakdown.stylusL2) / maxGas) * 100;
            const solidityWidth = (Number(breakdown.solidityL2) / maxGas) * 100;

            return (
              <div key={depth} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Depth {depth}</span>
                  <Badge className="bg-green-500 text-white">
                    {breakdown.l2Ratio.toFixed(1)}x faster
                  </Badge>
                </div>

                {/* Solidity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-400">Solidity</span>
                    <span className="font-mono text-purple-400">
                      {formatGas(breakdown.solidityL2)} gas
                    </span>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${solidityWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stylus Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-400">Stylus</span>
                    <span className="font-mono text-orange-400">
                      {formatGas(breakdown.stylusL2)} gas
                    </span>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${stylusWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          {breakdowns.map(({ depth, breakdown }) => {
            if (!breakdown) return null;

            return (
              <div
                key={depth}
                className="text-center p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-cyan-500/40"
              >
                <div className="text-xs text-muted-foreground mb-1">Depth {depth}</div>
                <div className="text-2xl font-bold text-green-400">
                  {breakdown.l2Ratio.toFixed(1)}x
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatGas(breakdown.stylusL2)} vs {formatGas(breakdown.solidityL2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* L1 Percentage Info */}
        {breakdowns[0]?.breakdown && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h5 className="font-semibold text-sm text-cyan-400 flex items-center gap-2">
                  L1 Data Cost: ~{breakdowns[0].breakdown.stylusL1Percentage.toFixed(0)}% of Total Gas
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                    Actual
                  </Badge>
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-cyan-400 font-medium">Actual L1 data cost from Arbitrum receipt:</span>
                  <br />
                  Stylus: {formatGas(breakdowns[0].breakdown.stylusL1)} gas |
                  Solidity: {formatGas(breakdowns[0].breakdown.solidityL1)} gas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Insight */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/20 via-transparent to-green-500/20 border border-green-500/30">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <div>
              <div className="font-semibold text-sm">Total Gas Savings</div>
              <div className="text-xs text-muted-foreground">
                Stylus (Rust/WASM) vs Solidity for Poseidon hash
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
              ~{breakdowns[0]?.breakdown?.totalRatio.toFixed(1) || "2"}x
            </div>
            <div className="text-xs text-muted-foreground">Actual measurement</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
