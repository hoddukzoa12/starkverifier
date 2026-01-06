"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface GasMeasurement {
  type: "stylus" | "solidity";
  depth: number;
  gasUsed: bigint;
  l1DataGas?: bigint;
  l2Computation?: bigint;
  txHash: string;
  timestamp: number;
}

export interface L2BreakdownResult {
  stylusTotal: bigint;
  solidityTotal: bigint;
  stylusL2: bigint;
  solidityL2: bigint;
  stylusL1: bigint;
  solidityL1: bigint;
  totalRatio: number;
  l2Ratio: number;
  stylusL1Percentage: number;
  solidityL1Percentage: number;
}

export interface GasStats {
  stylus: { [depth: number]: bigint[] };
  solidity: { [depth: number]: bigint[] };
}

interface GasContextType {
  measurements: GasMeasurement[];
  stats: GasStats;
  addMeasurement: (measurement: GasMeasurement) => void;
  clearMeasurements: () => void;
  getAverageGas: (type: "stylus" | "solidity", depth: number) => bigint | null;
  getLatestGas: (type: "stylus" | "solidity", depth: number) => bigint | null;
  getSavingsRatio: (depth: number) => string | null;
  getL2Breakdown: (depth: number) => L2BreakdownResult | null;
  getL2SavingsRatio: (depth: number) => string | null;
}

const GasContext = createContext<GasContextType | undefined>(undefined);

export function GasProvider({ children }: { children: ReactNode }) {
  const [measurements, setMeasurements] = useState<GasMeasurement[]>([]);
  const [stats, setStats] = useState<GasStats>({
    stylus: {},
    solidity: {},
  });

  const addMeasurement = useCallback((measurement: GasMeasurement) => {
    setMeasurements((prev) => [measurement, ...prev].slice(0, 100)); // Keep last 100

    setStats((prev) => {
      const newStats = { ...prev };
      const typeStats = { ...newStats[measurement.type] };

      if (!typeStats[measurement.depth]) {
        typeStats[measurement.depth] = [];
      }

      typeStats[measurement.depth] = [
        measurement.gasUsed,
        ...typeStats[measurement.depth],
      ].slice(0, 10); // Keep last 10 per depth

      newStats[measurement.type] = typeStats;
      return newStats;
    });
  }, []);

  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
    setStats({ stylus: {}, solidity: {} });
  }, []);

  const getAverageGas = useCallback(
    (type: "stylus" | "solidity", depth: number): bigint | null => {
      const depthStats = stats[type][depth];
      if (!depthStats || depthStats.length === 0) return null;

      const sum = depthStats.reduce((a, b) => a + b, BigInt(0));
      return sum / BigInt(depthStats.length);
    },
    [stats]
  );

  const getLatestGas = useCallback(
    (type: "stylus" | "solidity", depth: number): bigint | null => {
      const depthStats = stats[type][depth];
      if (!depthStats || depthStats.length === 0) return null;
      return depthStats[0];
    },
    [stats]
  );

  const getSavingsRatio = useCallback(
    (depth: number): string | null => {
      const stylusGas = getAverageGas("stylus", depth);
      const solidityGas = getAverageGas("solidity", depth);

      if (!stylusGas || !solidityGas || stylusGas === BigInt(0)) return null;

      const ratio = Number(solidityGas) / Number(stylusGas);
      return `${ratio.toFixed(1)}x`;
    },
    [getAverageGas]
  );

  const getL2Breakdown = useCallback(
    (depth: number): L2BreakdownResult | null => {
      // Find latest measurements for this depth
      const stylusMeasurement = measurements.find(
        (m) => m.type === "stylus" && m.depth === depth
      );
      const solidityMeasurement = measurements.find(
        (m) => m.type === "solidity" && m.depth === depth
      );

      // Need both measurements
      if (!stylusMeasurement || !solidityMeasurement) return null;

      const stylusTotal = stylusMeasurement.gasUsed;
      const solidityTotal = solidityMeasurement.gasUsed;

      // Only use actual L1 data from receipts (no estimation)
      const hasActualL1 =
        stylusMeasurement.l1DataGas !== undefined &&
        solidityMeasurement.l1DataGas !== undefined;

      // Return null if no actual L1 data available
      if (!hasActualL1) return null;

      const stylusL1 = stylusMeasurement.l1DataGas!;
      const stylusL2 = stylusMeasurement.l2Computation!;
      const solidityL1 = solidityMeasurement.l1DataGas!;
      const solidityL2 = solidityMeasurement.l2Computation!;

      const totalRatio =
        stylusTotal > 0 ? Number(solidityTotal) / Number(stylusTotal) : 1;
      const l2Ratio = stylusL2 > 0 ? Number(solidityL2) / Number(stylusL2) : 1;
      const stylusL1Percentage =
        stylusTotal > 0 ? (Number(stylusL1) / Number(stylusTotal)) * 100 : 0;
      const solidityL1Percentage =
        solidityTotal > 0 ? (Number(solidityL1) / Number(solidityTotal)) * 100 : 0;

      return {
        stylusTotal,
        solidityTotal,
        stylusL2,
        solidityL2,
        stylusL1,
        solidityL1,
        totalRatio,
        l2Ratio,
        stylusL1Percentage,
        solidityL1Percentage,
      };
    },
    [measurements]
  );

  const getL2SavingsRatio = useCallback(
    (depth: number): string | null => {
      const breakdown = getL2Breakdown(depth);
      if (!breakdown || breakdown.stylusL2 === BigInt(0)) return null;

      return `${breakdown.l2Ratio.toFixed(1)}x`;
    },
    [getL2Breakdown]
  );

  return (
    <GasContext.Provider
      value={{
        measurements,
        stats,
        addMeasurement,
        clearMeasurements,
        getAverageGas,
        getLatestGas,
        getSavingsRatio,
        getL2Breakdown,
        getL2SavingsRatio,
      }}
    >
      {children}
    </GasContext.Provider>
  );
}

export function useGas() {
  const context = useContext(GasContext);
  if (context === undefined) {
    throw new Error("useGas must be used within a GasProvider");
  }
  return context;
}
