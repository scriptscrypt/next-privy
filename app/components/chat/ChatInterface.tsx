'use client';

import { useLogin, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useRef, useState } from 'react';
import { SolanaAgentKit } from "solana-agent-kit";
import { useChat, type Message } from '../../hooks/useChat';

export default function ChatInterface() {
  const { messages, isLoading, error, sendMessage } = useChat();
  const { authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { wallets } = useSolanaWallets();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<SolanaAgentKit | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create SolanaAgentKit 'agent' instance for frontend actions 
  useEffect(() => {
    if (wallets.length > 0 && !agent) {
      const wallet = wallets[0];
      try {
        // Validate wallet address before creating PublicKey
        if (!wallet.address || typeof wallet.address !== 'string') {
          throw new Error('Invalid wallet address');
        }
        
        // Test if address is valid base58
        try {
          new PublicKey(wallet.address);
        } catch (error) {
          throw new Error(`Invalid Solana address format: ${wallet.address}`);
        }

        const newAgent = new SolanaAgentKit(
          {
            publicKey: new PublicKey(wallet.address),
            signTransaction: wallet.signTransaction.bind(wallet),
            signMessage: wallet.signMessage.bind(wallet),
            sendTransaction: async (tx) => {
              const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', "confirmed");
              return await wallet.sendTransaction(tx, connection);
            },
            signAllTransactions: wallet.signAllTransactions?.bind(wallet) || (async (txs: any[]) => {
              return Promise.all(txs.map(tx => wallet.signTransaction(tx)));
            }),
            signAndSendTransaction: async (tx) => {
              const signed = await wallet.signTransaction(tx);
              const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', "confirmed");
              const signature = await wallet.sendTransaction(signed, connection);
              return { signature };
            },
          },
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          {
            OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
            OTHER_API_KEYS: {
              JUPITER_API_KEY: process.env.NEXT_PUBLIC_JUPITER_API_KEY || ''
            }
          }
        )
        // .use(TokenPlugin);

        setAgent(newAgent);
      } catch (error) {
        console.error('Failed to create SolanaAgentKit:', error);
      }
    }
  }, [wallets, agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-4xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Welcome to SendAI Chat
        </h1>
        <p className="text-lg mt-3 bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent text-center max-w-md">
          Join the conversation! Login with your Solana wallet to access our AI-powered chat experience.
        </p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Connect Wallet to Start Chatting
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-24px)] mt-12 mx-auto px-4">
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start justify-start h-full px-4 pt-24">
              <h1 className="text-4xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome, {user?.email?.address || user?.phone?.number || "User"}
              </h1>
              <p className="text-lg mt-3 bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                How can I help you with Solana today?
              </p>
              {wallets.length > 0 && (
                <p className="text-sm mt-2 text-gray-500">
                  Connected Solana wallet: {wallets[0].address.slice(0, 8)}...
                  {wallets[0].address.slice(-8)}
                </p>
              )}
            </div>
          ) : (
            messages.map((message: Message) => (
              <div key={message.id} className="flex items-start justify-start">
                <div className="flex-shrink-0 mr-3">
                  <div
                    className={`${
                      message.role === "user" ? "bg-blue-500" : "bg-gray-600"
                    } flex items-center justify-center w-8 h-8 rounded-lg`}
                  >
                    {message.role === "user" ? (
                      <span className="text-white text-sm font-medium">U</span>
                    ) : (
                      <span className="text-white text-sm font-medium">AI</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-600 mr-2">
                      {message.role === "user" ? "You" : "Solana AI"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getCurrentTime()}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg max-w-3xl ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 p-2 relative">
          <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="w-full px-4 py-3">
              <textarea
                className="w-full min-h-[24px] bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none resize-none"
                placeholder="Ask me anything about Solana..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSubmit(e))
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {wallets.length > 0 ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Solana Wallet Connected
                  </span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    Solana Wallet Not Connected
                  </span>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm mt-4">
            Powered by Solana Agent Kit 2.0 & OpenAI
          </div>
        </div>
      </div>
    </div>
  );
}
