import { ConnectWallet } from "@/components/ConnectWallet";
import { VerifyPanel } from "@/components/VerifyPanel";
import { GasComparison } from "@/components/GasComparison";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { L2ComputationChart } from "@/components/L2ComputationChart";
import { Badge } from "@/components/ui/badge";
import { Zap, Github, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">STARK Stylus Verifier</h1>
                <p className="text-xs text-muted-foreground">
                  10-18x Gas Savings on Arbitrum
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                Arbitrum Sepolia
              </Badge>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600">
              Arbitrum APAC Mini Hackathon 2026
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              STARK Verification,{" "}
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                18x Cheaper
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Poseidon hash and Merkle path verification implemented in Rust for Arbitrum Stylus.
              Experience the gas savings compared to Solidity in real-time.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Stylus (Rust/WASM)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Solidity (EVM)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>18x Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <VerifyPanel />
            <GasComparison />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <BenchmarkTable />
            <L2ComputationChart />
          </div>
        </div>
      </section>

      {/* Why Stylus Section */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Stylus Wins for STARK
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">64</span>
              </div>
              <h4 className="font-semibold mb-2">64-bit Registers</h4>
              <p className="text-sm text-muted-foreground">
                Native 64-bit operations vs EVM&apos;s 256-bit overhead. Perfect for field arithmetic.
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">Native Loops</h4>
              <p className="text-sm text-muted-foreground">
                No gas metering overhead per iteration. Poseidon&apos;s 65 rounds execute natively.
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">0</span>
              </div>
              <h4 className="font-semibold mb-2">Zero Precompile</h4>
              <p className="text-sm text-muted-foreground">
                STARK operations have no EVM precompiles. Stylus provides the missing efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-center mb-8">Tech Stack</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Arbitrum Stylus",
              "Rust",
              "Solidity",
              "Next.js 16",
              "thirdweb v5",
              "Poseidon BN254",
              "Foundry",
              "shadcn/ui",
            ].map((tech) => (
              <Badge key={tech} variant="secondary" className="text-sm py-1 px-3">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built for Arbitrum APAC Mini Hackathon 2026
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hoddukzoa12/starkverifier.git"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>Source Code</span>
              </a>
              <a
                href="https://docs.arbitrum.io/stylus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Stylus Docs</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
