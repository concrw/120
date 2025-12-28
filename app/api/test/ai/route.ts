import { NextResponse } from "next/server";
import Replicate from "replicate";
import OpenAI from "openai";

export async function GET() {
  try {
    const results = {
      tests: [] as any[],
    };

    // Test 1: Replicate API connection
    try {
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });

      // Simple test - just check if we can list models (won't actually run)
      const models = await replicate.models.list();

      results.tests.push({
        service: "Replicate API",
        test: "API connection and authentication",
        passed: true,
        message: "Successfully connected to Replicate",
      });
    } catch (error: any) {
      results.tests.push({
        service: "Replicate API",
        test: "API connection and authentication",
        passed: false,
        error: error.message,
      });
    }

    // Test 2: OpenAI API connection
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      // Simple test - list models
      const models = await openai.models.list();

      results.tests.push({
        service: "OpenAI API",
        test: "API connection and authentication",
        passed: true,
        message: "Successfully connected to OpenAI",
        available_models: models.data.slice(0, 5).map((m) => m.id),
      });
    } catch (error: any) {
      results.tests.push({
        service: "OpenAI API",
        test: "API connection and authentication",
        passed: false,
        error: error.message,
      });
    }

    // Test 3: OpenAI GPT-4 prompt generation test
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a fashion AI prompt generator. Generate a short prompt for a fashion model wearing a dress.",
          },
          {
            role: "user",
            content: "Generate a prompt for an elegant evening dress.",
          },
        ],
        max_tokens: 100,
      });

      const prompt = completion.choices[0].message.content;

      results.tests.push({
        service: "OpenAI GPT-3.5-Turbo",
        test: "Prompt generation",
        passed: !!prompt && prompt.length > 0,
        message: "Successfully generated fashion prompt",
        sample_prompt: prompt?.substring(0, 100) + "...",
      });
    } catch (error: any) {
      results.tests.push({
        service: "OpenAI GPT-3.5-Turbo",
        test: "Prompt generation",
        passed: false,
        error: error.message,
      });
    }

    const allPassed = results.tests.every((t) => t.passed);

    return NextResponse.json({
      status: allPassed ? "passed" : "failed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "AI service test failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
