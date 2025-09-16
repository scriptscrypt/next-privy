'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { marked } from 'marked';

// Configure marked to prevent nested block elements in p tags
marked.setOptions({
  breaks: true,
  gfm: true,
});
import { type CoreMessage } from 'ai';

export function ChatInterface() {
  const { user, sendTransaction, signMessage } = usePrivy();
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userWallet, setUserWallet] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's Solana wallet address
  useEffect(() => {
    const getWalletAddress = async () => {
      try {
        if (user?.wallet?.address) {
          setUserWallet(user.wallet.address);
        }
      } catch (error) {
        console.error('Error getting wallet address:', error);
      }
    };

    if (user) {
      getWalletAddress();
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Note: Solana operations are now handled server-side via API route for better security

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: CoreMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          userWallet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const result = await response.json();

      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: result.text || 'Sorry, I didn\'t quite get that.',
        },
      ]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: error instanceof Error 
            ? `Error: ${error.message}` 
            : 'Oops! Something went wrong. Please make sure your environment variables are set correctly.',
        },
      ]);
    }

    setIsLoading(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-24px)] mt-12 mx-auto px-4">
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start justify-start h-full px-4 pt-24">
              <h1 className="text-4xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome, {user?.email?.address || user?.phone?.number || 'User'}
              </h1>
              <p className="text-lg mt-3 bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                How can I help you with Solana today?
              </p>
              {userWallet && (
                <p className="text-sm mt-2 text-gray-500">
                  Connected wallet: {userWallet.slice(0, 8)}...{userWallet.slice(-8)}
                </p>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="flex items-start justify-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`${m.role === 'user' ? 'bg-blue-500' : 'bg-gray-600'} flex items-center justify-center w-8 h-8 rounded-lg`}>
                    {m.role === 'user' ? (
                      <span className="text-white text-sm font-medium">U</span>
                    ) : (
                      <span className="text-white text-sm font-medium">AI</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-600 mr-2">
                      {m.role === 'user' ? 'You' : 'Solana AI'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getCurrentTime()}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg max-w-3xl ${
                    m.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {typeof m.content === 'string' ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: marked(m.content) }}
                        className="prose prose-sm max-w-none [&>*]:mb-2 [&>*:last-child]:mb-0 [&>p]:whitespace-pre-wrap"
                      />
                    ) : (
                      <span>[Unsupported content]</span>
                    )}
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
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {userWallet ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Wallet Connected
                  </span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    Wallet Not Connected
                  </span>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !userWallet}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
