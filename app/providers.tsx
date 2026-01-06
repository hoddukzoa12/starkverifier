"use client";

import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { GasProvider } from "@/lib/gas-context";
import { client } from "@/lib/client";
import { arbitrumSepolia } from "@/lib/chains";

interface ProvidersProps {
  children: React.ReactNode;
}

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("walletConnect"),
];

export function Providers({ children }: ProvidersProps) {
  return (
    <ThirdwebProvider>
      <AutoConnect
        client={client}
        wallets={wallets}
        timeout={15000}
        onConnect={(wallet) => {
          console.log("Auto-connected to wallet:", wallet.id);
        }}
      />
      <GasProvider>{children}</GasProvider>
    </ThirdwebProvider>
  );
}
