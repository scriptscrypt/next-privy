"use client";

import { useMemo } from "react";
import { useSolanaWallets } from "@privy-io/react-auth";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export function useSolanaAgent() {
  const { wallets: solanaWallets } = useSolanaWallets();

  const { agent, tools } = useMemo(() => {
    // Check if we have a connected Solana wallet
    const connectedWallet = solanaWallets.find((wallet) => wallet.connectedAt);

    if (!connectedWallet) {
      return { agent: null, tools: null };
    }

    try {
      // Create the agent with the Privy wallet adapter
      const agentInstance = new SolanaAgentKit(
        {
          publicKey: new PublicKey(connectedWallet.address),
          signTransaction: async (tx) => {
            const signed = await connectedWallet.signTransaction(tx);
            return signed;
          },
          signMessage: async (msg) => {
            const signed = await connectedWallet.signMessage(msg);
            return signed;
          },
          sendTransaction: async (tx) => {
            const connection = new Connection(RPC_URL, "confirmed");
            return await connectedWallet.sendTransaction(tx, connection);
          },
          signAllTransactions: async (txs) => {
            const signed = await connectedWallet.signAllTransactions(txs);
            return signed;
          },
          signAndSendTransaction: async (tx) => {
            const signed = await connectedWallet.signTransaction(tx);
            const connection = new Connection(RPC_URL, "confirmed");
            const sig = await connectedWallet.sendTransaction(
              signed,
              connection
            );
            return { signature: sig };
          },
        },
        RPC_URL,
        {}
      ).use(TokenPlugin);

      // Create tools for AI
      const agentTools = createVercelAITools(
        agentInstance,
        agentInstance.actions
      );

      console.log("agentTools", agentTools);

      return {
        agent: agentInstance,
        tools: agentTools,
      };
    } catch (error) {
      console.error("Failed to create Solana agent:", error);
      return { agent: null, tools: null };
    }
  }, [solanaWallets]);

  return {
    agent,
    tools,
    isReady: !!agent,
    connectedWallet: solanaWallets.find((wallet) => wallet.connectedAt),
  };
}
