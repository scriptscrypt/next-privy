"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { marked } from "marked";
import { ChatOpenAI } from "@langchain/openai";
import { useSolanaAgent } from "@/app/hooks/useSolanaAgent";

// Configure marked to prevent nested block elements in p tags
marked.setOptions({
  breaks: true,
  gfm: true,
});
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

export function ChatInterface() {
  const { user } = usePrivy();
  const { agent, tools, isReady, connectedWallet } = useSolanaAgent();
  const [messages, setMessages] = useState<(HumanMessage | AIMessage)[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log(tools);
  const userWallet = connectedWallet?.address || "";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !isReady) return;

    const userMessage = new HumanMessage(input);
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        temperature: 0.7,
      });

      // Bind tools to the model
      const modelWithTools =
        tools && tools.length > 0 ? model.bindTools(tools) : model;

      const systemMessage =
        new SystemMessage(`You're a helpful Solana assistant that helps people with Solana operations and questions.
        
        You can provide information about:
        - Solana basics and concepts
        - Token transfers and transactions
        - DeFi protocols on Solana
        - NFTs and digital assets
        - Wallet management and security
        - Market data and analysis
        - Development resources
        
        The user's wallet address is: ${userWallet || "Not connected"}
        
        You have access to Solana tools that can execute real transactions and operations.
        Always explain what you're doing when using tools and ask for confirmation before executing transactions.
        
        Be helpful, informative, and always prioritize security best practices.`);

      const allMessages = [systemMessage, ...updatedMessages];

      const result = await modelWithTools.invoke(allMessages);

      // Check if the result contains tool calls
      if (result.tool_calls && result.tool_calls.length > 0) {
        console.log("Tool calls detected:", result.tool_calls);

        // Execute the tools
        const toolResults = [];
        for (const toolCall of result.tool_calls) {
          try {
            console.log(
              `Executing tool: ${toolCall.name} with args:`,
              toolCall.args
            );

            // Find the corresponding tool from our tools array
            const tool = tools?.find((t) => t.name === toolCall.name);
            if (!tool) {
              throw new Error(`Tool ${toolCall.name} not found`);
            }

            // Execute the tool
            const toolResult = await tool.invoke(toolCall.args);
            toolResults.push({
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              result: toolResult,
            });

            console.log(`Tool ${toolCall.name} result:`, toolResult);
          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            toolResults.push({
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              result: {
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }
        }

        // Create a response message with the tool results
        let responseContent =
          typeof result.content === "string" ? result.content : "";

        // Add tool results to the response
        if (toolResults.length > 0) {
          responseContent += "\n\n**Tool Results:**\n";
          toolResults.forEach(({ toolName, result }) => {
            if (result.error) {
              responseContent += `- **${toolName}**: Error - ${result.error}\n`;
            } else {
              responseContent += `- **${toolName}**: ${JSON.stringify(
                result,
                null,
                2
              )}\n`;
            }
          });
        }

        const aiMessage = new AIMessage(responseContent);
        setMessages([...updatedMessages, aiMessage]);
      } else {
        const aiMessage = new AIMessage(
          typeof result.content === "string"
            ? result.content
            : JSON.stringify(result.content)
        );
        setMessages([...updatedMessages, aiMessage]);
      }
    } catch (error) {
      console.error("AI error:", error);
      const errorMessage = new AIMessage(
        error instanceof Error
          ? `Error: ${error.message}`
          : "Oops! Something went wrong. Please make sure your environment variables are set correctly."
      );
      setMessages([...updatedMessages, errorMessage]);
    }

    setIsLoading(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
              {userWallet && (
                <p className="text-sm mt-2 text-gray-500">
                  Connected wallet: {userWallet.slice(0, 8)}...
                  {userWallet.slice(-8)}
                </p>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="flex items-start justify-start">
                <div className="flex-shrink-0 mr-3">
                  <div
                    className={`${
                      m instanceof HumanMessage ? "bg-blue-500" : "bg-gray-600"
                    } flex items-center justify-center w-8 h-8 rounded-lg`}
                  >
                    {m instanceof HumanMessage ? (
                      <span className="text-white text-sm font-medium">U</span>
                    ) : (
                      <span className="text-white text-sm font-medium">AI</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-600 mr-2">
                      {m instanceof HumanMessage ? "You" : "Solana AI"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getCurrentTime()}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg max-w-3xl ${
                      m instanceof HumanMessage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {typeof m.content === "string" ? (
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
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {isReady ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Agent Ready
                  </span>
                ) : userWallet ? (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
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
                disabled={isLoading || !input.trim() || !isReady}
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
