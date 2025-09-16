import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages, userWallet } = await request.json();

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      system: `You're a helpful Solana assistant that helps people with Solana blockchain operations and questions.
      
      You can provide information about:
      - Solana blockchain basics and concepts
      - Token transfers and transactions
      - DeFi protocols on Solana
      - NFTs and digital assets
      - Wallet management and security
      - Market data and analysis
      - Development resources
      
      The user's wallet address is: ${userWallet || "Not connected"}
      
      Important: You can provide guidance and information, but you cannot directly execute transactions. 
      For actual blockchain operations, users need to use their connected wallet interface.
      
      Be helpful, informative, and always prioritize security best practices.`,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to process chat request. Please check your API configuration.",
      },
      { status: 500 }
    );
  }
}
