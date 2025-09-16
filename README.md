# Solana AI Chat App

A modern chat application that combines OpenAI's GPT-4 with Solana blockchain capabilities, secured with Privy authentication. Users can chat with AI and execute Solana blockchain operations through natural language.

## Features

- 🤖 **AI Chat**: Powered by OpenAI GPT-4 with streaming responses
- 🔗 **Solana Integration**: Built-in Solana Agent Kit for blockchain operations
- 🔐 **Secure Authentication**: Privy wallet authentication with embedded Solana wallets
- 💬 **Real-time Chat**: Streaming responses with modern UI
- 🛠️ **Quick Actions**: One-click Solana operations (balance, transfers, etc.)
- 📱 **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- Privy account and app configuration
- Solana wallet private key (for agent operations)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd next-privy
   pnpm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file with the following variables:
   ```env
   # Privy Configuration
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
   NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id_here

   # OpenAI Configuration
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

   # Solana Configuration
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_PRIVATE_KEY=your_solana_private_key_here
   ```

3. **Configure Privy:**
   - Sign up at [Privy](https://privy.io)
   - Create a new app
   - Enable Solana embedded wallets
   - Copy your App ID and Client ID

4. **Get API Keys:**
   - **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com)
   - **Solana**: Generate a keypair or use an existing wallet's private key

5. **Run the development server:**
   ```bash
   pnpm dev
   ```

6. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Authentication
- Click "Connect Wallet & Start Chatting" to authenticate with Privy
- The app supports email, phone, and wallet-based authentication
- Embedded Solana wallets are created automatically

### Chat Features
- Ask general questions to the AI
- Request Solana blockchain operations using natural language
- Use quick action buttons for common operations

### Example Prompts
```
"What's my SOL balance?"
"Transfer 0.1 SOL to [address]"
"How do I swap tokens on Solana?"
"Explain what DeFi is"
"Show me my wallet address"
```

### Quick Actions
- **Balance**: Check your SOL balance
- **Address**: Get your wallet address
- **Send SOL**: Transfer SOL to another address

## API Routes

### `/api/chat`
- **Method**: POST
- **Description**: Handles AI chat with OpenAI integration
- **Features**: Streaming responses, Solana context awareness

### `/api/solana`
- **Method**: POST
- **Description**: Executes Solana blockchain operations
- **Actions**: 
  - `getBalance`: Check wallet balance
  - `transfer`: Send SOL
  - `getTokenBalance`: Check token balance
  - `trade`: Swap tokens
  - `getWalletAddress`: Get wallet address

## Project Structure

```
app/
├── api/
│   ├── chat/route.ts          # OpenAI chat integration
│   └── solana/route.ts        # Solana operations
├── components/
│   └── chat/
│       ├── ChatInterface.tsx   # Main chat component
│       ├── ChatMessage.tsx     # Message display
│       ├── ChatInput.tsx       # Message input
│       └── SolanaToolbar.tsx   # Quick actions
├── providers/
│   └── privy.tsx              # Privy authentication
├── globals.css                # Global styles
├── layout.tsx                 # Root layout
└── page.tsx                   # Main page
```

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Privy (embedded wallets)
- **AI**: OpenAI GPT-4 with streaming
- **Blockchain**: Solana Agent Kit, @solana/web3.js
- **UI**: Lucide React icons, custom components

## Security Notes

- Private keys should be stored securely in production
- Use environment variables for all sensitive data
- Consider using a key management service for production deployments
- The embedded Solana wallets are managed by Privy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and development purposes. Please ensure you comply with all relevant licenses and terms of service for the APIs and services used.

## Support

For issues related to:
- **Privy**: Check [Privy Documentation](https://docs.privy.io)
- **OpenAI**: Check [OpenAI Documentation](https://platform.openai.com/docs)
- **Solana**: Check [Solana Documentation](https://docs.solana.com)
- **Solana Agent Kit**: Check the [GitHub repository](https://github.com/sendaifun/solana-agent-kit)