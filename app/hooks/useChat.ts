'use client';

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const { user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Get the first connected Solana wallet
    const solanaWallet = solanaWallets.find(wallet => wallet.connectedAt);
    
    if (!solanaWallet?.address) {
      setError('Solana wallet not connected');
      return;
    }

    // Validate wallet address format
    try {
      // Basic validation - check if it looks like a Solana address
      if (typeof solanaWallet.address !== 'string' || solanaWallet.address.length < 32 || solanaWallet.address.length > 44) {
        throw new Error('Invalid Solana wallet address format');
      }
    } catch (error) {
      setError(`Invalid Solana wallet address: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    console.log('Sending message with Solana wallet:', {
      address: solanaWallet.address,
      addressType: typeof solanaWallet.address,
      addressLength: solanaWallet.address.length,
      addressPreview: `${solanaWallet.address.slice(0, 8)}...${solanaWallet.address.slice(-8)}`
    });

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          wallet: {
            address: solanaWallet.address,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content !== undefined) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: parsed.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messages, solanaWallets]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
