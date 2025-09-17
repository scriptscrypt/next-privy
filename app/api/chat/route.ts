
import OpenAI from "openai";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import { Connection, PublicKey } from "@solana/web3.js";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});

/**
 * Find the best matching function from available methods
 * @param functionName The function name to match
 * @param availableMethods Object containing available methods
 * @returns The name of the best matching method or null if no match found
 */
function findBestMatchingFunction(
  functionName: string,
  availableMethods: Record<string, any>
): string | null {
  // Direct lookup first - check if the function name matches a method name directly
  if (availableMethods[functionName.toLowerCase()]) {
    return functionName.toLowerCase();
  }

  // Handle balance-related function names
  if (functionName === "SOLANA_BALANCE" && availableMethods["get_balance"]) {
    return "get_balance";
  }

  if (functionName === "GET_SOL_BALANCE" && availableMethods["get_balance"]) {
    return "get_balance";
  }

  if (functionName === "GET_BALANCE" && availableMethods["get_balance"]) {
    return "get_balance";
  }

  if (functionName === "WALLET_BALANCE" && availableMethods["get_balance"]) {
    return "get_balance";
  }

  // Handle common function name mappings
  const functionMappings: Record<string, string> = {
    TRANSFER_SOL: "transfer",
    TRANSFER: "transfer",
    SEND_SOL: "transfer",
    SOLANA_BALANCE: "get_balance",
    GET_BALANCE: "get_balance",
    WALLET_BALANCE: "get_balance",
    GET_SOL_BALANCE: "get_balance",
    CHECK_BALANCE: "get_balance",
    SHOW_BALANCE: "get_balance",
    BALANCE_ACTION: "get_balance",
    BUY: "trade",
    BUY_TOKEN: "trade",
    PURCHASE_TOKEN: "trade",
    SWAP_FOR: "trade",
    SELL_TOKEN: "trade",
    SELL: "trade",
    SWAP_TOKEN: "trade",
    SWAP: "swap",
    GET_TOKEN_PRICE: "fetchPrice",
    GET_PRICE: "fetchPrice",
    FETCH_PRICE: "fetchPrice",
    GET_WALLET_ADDRESS: "getWalletAddress",
    WALLET_ADDRESS: "getWalletAddress",
    GET_TOKEN_BALANCE: "get_token_balance",
    TOKEN_BALANCE: "get_token_balance",
    TRANSFER_SPL: "transfer",
    SEND_TOKEN: "transfer",
  };

  // Check direct mappings first
  if (functionMappings[functionName]) {
    const mappedFunction = functionMappings[functionName];
    if (availableMethods[mappedFunction]) {
      return mappedFunction;
    }
  }

  // Convert function name to lowercase and remove special characters
  const normalizedInput = functionName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Create patterns to match against
  const patterns = [
    // Exact match (case-insensitive)
    new RegExp(`^${normalizedInput}$`, "i"),
    // Contains the entire input
    new RegExp(normalizedInput, "i"),
    // Match parts (for compound words)
    new RegExp(normalizedInput.split(/[_\s]/).join(".*"), "i"),
    // Special cases for common prefixes/suffixes
    new RegExp(`(get|transfer|send)?${normalizedInput}`, "i"),
    new RegExp(`${normalizedInput}(sol|spl|token)?$`, "i"),
    // Handle SOLANA_BALANCE -> get_balance
    new RegExp(`get.*${normalizedInput.replace("solana", "sol")}`, "i"),
  ];

  // Try each pattern in order of specificity
  for (const pattern of patterns) {
    const matches = Object.keys(availableMethods).filter((method) => {
      const normalizedMethod = method.toLowerCase().replace(/[^a-z0-9]/g, "");
      return pattern.test(normalizedMethod);
    });

    if (matches.length > 0) {
      // If multiple matches, prefer the most specific one
      return matches.sort((a, b) => b.length - a.length)[0];
    }
  }

  return null;
}

// Singleton agent cache
let cachedAgent: SolanaAgentKit | null = null;
let cachedWalletAddress: string | null = null;

function getOrCreateAgent(walletAddress: string): SolanaAgentKit {
  // Return cached agent if wallet address hasn't changed
  if (cachedAgent && cachedWalletAddress === walletAddress) {
    return cachedAgent;
  }

  // Validate wallet address before creating PublicKey
  if (!walletAddress || typeof walletAddress !== "string") {
    throw new Error("Invalid wallet address provided");
  }

  // Check if it's an Ethereum address (starts with 0x)
  if (walletAddress.startsWith("0x")) {
    throw new Error(
      `Ethereum address detected: ${walletAddress}. Please connect a Solana wallet instead.`
    );
  }

  // Check if address is valid base58
  try {
    new PublicKey(walletAddress);
  } catch (error) {
    throw new Error(
      `Invalid Solana address format: ${walletAddress}. Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // Create new agent if wallet changed or no cached agent exists
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
  
  // Create a more complete wallet object that matches solana-agent-kit expectations
  const minimalWallet = {
    publicKey: new PublicKey(walletAddress),
    connection: connection,
    getBalance: async () => {
      return await connection.getBalance(new PublicKey(walletAddress));
    },
    signTransaction: async (tx: any) => {
      throw new Error("Transfer execution should happen in frontend");
    },
    signMessage: async (msg: any) => {
      throw new Error("Transfer execution should happen in frontend");
    },
    sendTransaction: async (tx: any) => {
      throw new Error("Transfer execution should happen in frontend");
    },
    signAllTransactions: async (txs: any[]) => {
      throw new Error("Transfer execution should happen in frontend");
    },
    signAndSendTransaction: async (tx: any) => {
      throw new Error("Transfer execution should happen in frontend");
    },
  };

  cachedAgent = new SolanaAgentKit(
    minimalWallet,
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    {
      OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    }
  ).use(TokenPlugin);

  cachedWalletAddress = walletAddress;
  return cachedAgent;
}

export async function POST(req: Request) {
  const { messages, wallet } = await req.json();

  console.log("Received wallet data:", {
    hasWallet: !!wallet,
    hasAddress: !!wallet?.address,
    addressType: typeof wallet?.address,
    addressLength: wallet?.address?.length,
    addressPreview: wallet?.address
      ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}`
      : "none",
    isEthereumAddress: wallet?.address?.startsWith("0x"),
    isSolanaAddress:
      wallet?.address &&
      !wallet.address.startsWith("0x") &&
      wallet.address.length >= 32 &&
      wallet.address.length <= 44,
  });

  if (!wallet?.address) {
    return new Response(JSON.stringify({ error: "Wallet not connected" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Get or create singleton agent for this wallet
    let agent;
    try {
      agent = getOrCreateAgent(wallet.address);
    } catch (agentError) {
      console.error("Agent creation error:", agentError);
      return new Response(
        JSON.stringify({
          error: `Failed to create agent: ${
            agentError instanceof Error ? agentError.message : "Unknown error"
          }`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create tools for OpenAI using the available methods directly
    console.log("🚨🚨🚨 AVAILABLE AGENT METHODS:", Object.keys(agent.methods));
    
    // Create tools directly from the available methods
    const solanaTools = Object.keys(agent.methods).map((methodName) => {
      // Map method names to user-friendly tool names
      const toolName = methodName.toUpperCase().replace(/_/g, '_');
      
      return {
        type: "function" as const,
        function: {
          name: toolName,
          description: `Execute ${methodName} operation`,
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      };
    });
    
    console.log("🚨🚨🚨 CREATED SOLANA TOOLS:", solanaTools.map(t => t.function.name));

    // Add system message to be explicit about function arguments
    const systemMessage = {
      role: "system",
      content: `You are a Solana assistant that MUST use the available tools to help users with blockchain operations.

      CRITICAL: You MUST use the provided tools/functions for ALL blockchain operations. Do NOT respond with plain text when a tool should be used.

      AVAILABLE TOOLS:

      1. GET_BALANCE - Check SOL balance
         Usage: When users ask about balance, call GET_BALANCE with {}

      2. TRANSFER - Transfer SOL tokens
         Usage: When users want to transfer SOL, call TRANSFER with {"to": "address", "amount": number}
         Examples:
         - "transfer 0.01 sol to address" → TRANSFER({"to": "address", "amount": 0.01})
         - "send 0.5 SOL to address" → TRANSFER({"to": "address", "amount": 0.5})
         - "transfer 1.5 sol to address" → TRANSFER({"to": "address", "amount": 1.5})

      3. GET_WALLET_ADDRESS - Get wallet address
         Usage: When users ask for wallet address, call GET_WALLET_ADDRESS with {}

      4. TRADE - Buy/sell tokens
         Usage: When users want to trade tokens, call TRADE with appropriate parameters
         Examples:
         - "buy 1 sol worth of USDC" → TRADE({"outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "inputAmount": 1})
         - "purchase tokens with address ABC123" → TRADE({"outputMint": "ABC123", "inputAmount": 0.1})

      5. SWAP - Swap tokens
         Usage: When users want to swap tokens, call SWAP with appropriate parameters

      STRICT RULES:
      1. ALWAYS use the appropriate tool when users request blockchain operations
      2. NEVER respond with plain text when a tool should be called
      3. For transfer requests, ALWAYS call TRANSFER with the exact address and numeric amount
      4. For buy/trade requests, ALWAYS call TRADE with appropriate parameters
      5. Extract wallet addresses exactly as provided by the user
      6. Convert amounts to numbers (e.g., "0.01" becomes 0.01)
      7. If a tool call fails, analyze the error and try again with corrected parameters
      8. Always provide complete, valid JSON arguments for tool calls
      9. When you see buy-related user messages, IMMEDIATELY call TRADE with proper parameters
      10. Do NOT wait for confirmation or ask questions - just execute the operation

      PARAMETER REQUIREMENTS:
      - TRADE function parameters depend on the specific operation
      - TRANSFER function MUST have: to (string) and amount (number)
      - All amounts must be numeric values, not strings

      ERROR RECOVERY:
      - If you get an error about undefined parameters, try the tool call again with proper parameters
      - If you get a circular reference error, the tool still worked - inform the user of success
      - Always attempt to use tools when users request blockchain operations
      - Ensure all parameters are properly formatted and typed

      REMEMBER: Use tools for actions, not just information responses.`,
    };

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-5-2025-08-07",
      // model: 'gpt-4',
      stream: true,
      messages: [
        systemMessage,
        ...messages.map((message: any) => ({
          content: message.content,
          role: message.role,
        })),
      ],
      tools: solanaTools,
    });

    // Transform the response into a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let currentMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
        };

        let currentToolCall = null;
        let argumentBuffer = "";
        let isCollectingArguments = false;
        let contentBuffer = "";
        let lastUpdateTime = Date.now();

        // Reset message for new responses
        const resetMessage = () => {
          currentMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
          };
          contentBuffer = "";
          lastUpdateTime = Date.now();
        };

        for await (const chunk of response) {
          // Handle content updates
          if (chunk.choices[0]?.delta?.content) {
            contentBuffer += chunk.choices[0].delta.content;
            const now = Date.now();

            // Send update if we have a word boundary or enough time has passed
            if (
              contentBuffer.endsWith(" ") ||
              contentBuffer.endsWith(".") ||
              contentBuffer.endsWith("?") ||
              contentBuffer.endsWith("!") ||
              now - lastUpdateTime > 100
            ) {
              currentMessage.content = contentBuffer;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(currentMessage)}\n\n`)
              );
              lastUpdateTime = now;
            }
            continue;
          }

          // Handle tool calls
          const toolCallDelta = chunk.choices[0]?.delta?.tool_calls?.[0];
          if (!toolCallDelta) continue;

          // Start of a new tool call
          if (toolCallDelta.id) {
            resetMessage();
            currentToolCall = toolCallDelta;
            isCollectingArguments = true;
            argumentBuffer = toolCallDelta.function?.arguments || "";
            continue;
          }

          // Collecting arguments
          if (isCollectingArguments && toolCallDelta.function?.arguments) {
            argumentBuffer += toolCallDelta.function.arguments;
          }

          // Try to detect end of tool call
          if (isCollectingArguments && argumentBuffer.endsWith("}")) {
            isCollectingArguments = false;

            try {
              console.log("🚨🚨🚨 RAW ARGUMENT BUFFER:", argumentBuffer);
              const args = JSON.parse(argumentBuffer);
              console.log("🚨🚨🚨 PARSED ARGS:", args);
              const functionName = currentToolCall?.function?.name;
              if (!functionName) {
                throw new Error("Function name not found in tool call");
              }
              const matchingFunction = findBestMatchingFunction(
                functionName,
                agent.methods
              );

              if (matchingFunction) {
                // Validate args before calling method
                if (!args || typeof args !== "object") {
                  throw new Error(`Invalid arguments received: ${args}`);
                }

                // Special validation for transfer functions
                if (
                  matchingFunction === "transfer" ||
                  functionName.includes("TRANSFER")
                ) {
                  if (!args.to || !args.amount) {
                    throw new Error(
                      `Transfer requires both 'to' and 'amount' parameters. Received: ${JSON.stringify(
                        args
                      )}`
                    );
                  }
                  if (typeof args.amount !== "number" || args.amount <= 0) {
                    throw new Error(
                      `Transfer amount must be a positive number. Received: ${args.amount}`
                    );
                  }
                }

                // Special validation for buy functions
                if (
                  matchingFunction === "buy" ||
                  functionName === "BUY" ||
                  functionName.includes("BUY")
                ) {
                  if (!args.outputMint || !args.inputAmount) {
                    throw new Error(
                      `Buy requires both 'outputMint' and 'inputAmount' parameters. Received: ${JSON.stringify(
                        args
                      )}`
                    );
                  }
                  if (
                    typeof args.inputAmount !== "number" ||
                    args.inputAmount <= 0
                  ) {
                    throw new Error(
                      `Buy inputAmount must be a positive number. Received: ${args.inputAmount}`
                    );
                  }
                }

                // Execute the tool call using the plugin's method
                const method = agent.methods[matchingFunction];
                console.log("🚨🚨🚨 EXECUTING METHOD:", matchingFunction);
                console.log("🚨🚨🚨 METHOD TYPE:", typeof method);
                console.log("🚨🚨🚨 METHOD:", method);
                console.log("🚨🚨🚨 AGENT WALLET:", agent.wallet);
                console.log("🚨🚨🚨 AGENT CONNECTION:", agent.connection);

                let result;
                try {
                  // Special handling for get_balance method
                  if (matchingFunction === 'get_balance') {
                    console.log("🚨🚨🚨 USING DIRECT BALANCE CALL");
                    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
                    const balance = await connection.getBalance(new PublicKey(wallet.address));
                    result = {
                      balance: balance / 1e9, // Convert lamports to SOL
                      lamports: balance,
                      response: `Your SOL balance is: ${(balance / 1e9).toFixed(6)} SOL`
                    };
                  } else {
                    result = await (method as any)(args);
                  }
                  console.log("🚨🚨🚨 RESULT:", JSON.stringify(result));
                  console.log("🚨🚨🚨 RESULT TYPE:", typeof result);
                  console.log("🚨🚨🚨 RESULT KEYS:", result ? Object.keys(result) : 'null/undefined');
                } catch (methodError) {
                  console.error(
                    "🚨🚨🚨 METHOD EXECUTION ERROR:",
                    methodError instanceof Error
                      ? methodError.message
                      : String(methodError)
                  );
                  throw methodError; // Re-throw to be caught by outer catch
                }

                // If there's a response message, add it to the content
                if (result.response) {
                  currentMessage.content =
                    typeof result.response === "string"
                      ? result.response
                      : JSON.stringify(result.response);
                } else if (result.balance !== undefined) {
                  // Handle balance results specifically
                  currentMessage.content = `Your SOL balance is: ${result.balance} SOL`;
                } else if (result.data) {
                  // Handle other data formats
                  currentMessage.content = typeof result.data === "string" 
                    ? result.data 
                    : JSON.stringify(result.data);
                } else {
                  // Provide a simple success message for tool execution
                  currentMessage.content = `✅ ${functionName} executed successfully`;
                }

                // Send the message
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(currentMessage)}\n\n`)
                );
              } else {
                throw new Error(
                  `Unknown function: ${functionName}. Available functions: ${Object.keys(
                    agent.methods
                  ).join(", ")}`
                );
              }
            } catch (error) {
              console.error(
                "Error executing tool call:",
                error instanceof Error ? error.message : String(error)
              );

              // Create a safe error message without circular references
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              currentMessage.content = `❌ Error: ${
                typeof errorMessage === "string"
                  ? errorMessage
                  : JSON.stringify(errorMessage)
              }`;

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(currentMessage)}\n\n`)
              );
            }
            // Reset for next tool call
            currentToolCall = null;
            argumentBuffer = "";
            isCollectingArguments = false;
            // Continue processing the stream after tool call completion
            continue;
          }
        }
        // Send the final "done" message
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
