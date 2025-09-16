"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export const PrivyProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        appearance: { 
          walletChainType: "ethereum-and-solana",
          theme: "light",
          accentColor: "#6366f1",
        },
        loginMethods: ["email", "sms", "wallet"],
      }}
    >
      {children}
    </PrivyProvider>
  );
};