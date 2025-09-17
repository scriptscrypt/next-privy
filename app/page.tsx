"use client";

import { usePrivy } from "@privy-io/react-auth";
import ChatInterface from "./components/chat/ChatInterface";
import { LogOut, User } from "lucide-react";

function Home() {
  const { ready, authenticated, logout, login, user } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gray-50">
      {authenticated ? (
        <div className="h-screen flex flex-col">
          {/* Top Navigation */}
          <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">SendAI</h1>
                <p className="text-xs text-gray-500">Powered Solana Agent Kit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user?.wallet?.address || 'Anonymous'}</span>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </nav>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Solana AI Chat
              </h1>
              <p className="text-gray-600 mb-6">
                Chat with AI and interact with Solana blockchain using natural language. 
                Connect your wallet to get started.
              </p>
              
              <button
                onClick={login}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect Wallet & Start Chatting
              </button>
              
              <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                <div className="flex items-center justify-center gap-4">
                  <span>✨ OpenAI GPT-4</span>
                  <span>🔗 Solana Integration</span>
                  <span>🔐 Secure Auth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
