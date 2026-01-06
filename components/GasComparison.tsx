"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { EXPECTED_BENCHMARKS } from "@/lib/contracts";
import { useGas } from "@/lib/gas-context";
import { TrendingDown, Radio } from "lucide-react";

const STYLUS_COLOR = "#f97316"; // orange-500
const SOLIDITY_COLOR = "#a855f7"; // purple-500
const DEPTHS = [8, 16, 32] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const stylusGas = payload.find((p) => p.name === "Stylus")?.value || 0;
    const solidityGas = payload.find((p) => p.name === "Solidity")?.value || 0;
    const savings = solidityGas > 0 ? (solidityGas / stylusGas).toFixed(1) : "0";

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()} gas
          </p>
        ))}
        <p className="text-sm font-medium text-green-500 mt-2">
          Savings: {savings}x
        </p>
      </div>
    );
  }
  return null;
};

export function GasComparison() {
  const { getAverageGas, getSavingsRatio, measurements } = useGas();

  // Build chart data from live measurements or fall back to expected
  const chartData = DEPTHS.map((depth) => {
    const liveStylusGas = getAverageGas("stylus", depth);
    const liveSolidityGas = getAverageGas("solidity", depth);
    const expected = EXPECTED_BENCHMARKS.find((b) => b.depth === depth);

    return {
      name: `Depth ${depth}`,
      Stylus: liveStylusGas ? Number(liveStylusGas) : expected?.stylusGas || 0,
      Solidity: liveSolidityGas ? Number(liveSolidityGas) : expected?.solidityGas || 0,
      isLive: !!(liveStylusGas || liveSolidityGas),
    };
  });

  // Check if we have any live data
  const hasLiveData = measurements.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-green-500" />
          Gas Comparison
          {hasLiveData && (
            <Badge variant="default" className="bg-green-500 ml-2 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasLiveData
            ? "Real-time gas measurements from your transactions"
            : "Stylus vs Solidity gas consumption by Merkle tree depth"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Stylus" fill={STYLUS_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Solidity" fill={SOLIDITY_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Summary */}
        <div className="grid grid-cols-3 gap-4">
          {DEPTHS.map((depth) => {
            const liveSavings = getSavingsRatio(depth);
            const expected = EXPECTED_BENCHMARKS.find((b) => b.depth === depth);
            const savings = liveSavings || expected?.savings || "-";
            const isLive = !!liveSavings;

            return (
              <div
                key={depth}
                className={`text-center p-4 rounded-lg border ${
                  isLive
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40"
                    : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
                }`}
              >
                <div className="text-2xl font-bold text-green-500 flex items-center justify-center gap-1">
                  {savings}
                  {isLive && <Radio className="h-3 w-3 animate-pulse" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  Depth {depth}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STYLUS_COLOR }}
            />
            <span>Stylus (Rust/WASM)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: SOLIDITY_COLOR }}
            />
            <span>Solidity (EVM)</span>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="text-xs text-center text-muted-foreground">
          {hasLiveData
            ? `Based on ${measurements.length} live transaction${measurements.length > 1 ? "s" : ""}`
            : "Showing expected benchmark data • Run verifications to see live results"}
        </div>
      </CardContent>
    </Card>
  );
}
