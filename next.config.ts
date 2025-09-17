import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://auth.privy.io https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://rpc.helius.xyz https://mainnet.helius-rpc.com https://devnet.helius-rpc.com https://testnet.helius-rpc.com https://solana-mainnet.g.alchemy.com https://www.google-analytics.com https://api.openai.com https://explorer-api.walletconnect.com https://registry.walletconnect.com wss:",
              "frame-src 'self' https://auth.privy.io",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  // Enable experimental features if needed
  experimental: {
    optimizePackageImports: ['@solana/web3.js', '@privy-io/react-auth']
  }
};

export default nextConfig;
