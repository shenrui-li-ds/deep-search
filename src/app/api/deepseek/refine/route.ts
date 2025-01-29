import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      );
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Calculate date 6 months ago for reference
    const sixMonthsAgo = new Date(currentDate);
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that refines search queries to make them more effective. Your goal is to make the query more specific and targeted while maintaining its original intent.

Current date: ${currentDate.toISOString()}

Guidelines for query refinement:
1. For temporal queries (e.g., "latest", "recent", "new"):
   - Default to the current year and recent months unless specified otherwise
   - Include specific time ranges when relevant
   - For "latest" queries, focus on the most recent developments
2. For trending topics:
   - Focus on recent developments and current state
   - Include temporal markers for better context
3. For general queries:
   - Add relevant qualifiers to improve search precision
   - Maintain user's original intent
   - Include important context that might be implied

Always aim to make queries more specific while keeping them natural and searchable. Return only the refined query without any explanation.`,
          },
          {
            role: 'user',
            content: `Please refine this search query to make it more effective and time-relevant: "${query}"

For queries about recent events or developments, consider the current date (${currentDate.toLocaleDateString()}) when refining the query.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const refinedQuery = data.choices[0].message.content.trim();

    return NextResponse.json({ refinedQuery });
  } catch (error) {
    console.error('Query refinement error:', error);
    return NextResponse.json(
      { error: 'Failed to refine query' },
      { status: 500 }
    );
  }
}
