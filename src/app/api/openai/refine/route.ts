import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const { query, model = 'gpt-4o' } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // Calculate date 6 months ago for reference
      const sixMonthsAgo = new Date(currentDate);
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
      
      const response = await openai.chat.completions.create({
        model: model,
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

Always aim to make queries more specific while keeping them natural and searchable.`,
          },
          {
            role: 'user',
            content: `Please refine this search query to make it more effective and time-relevant: "${query}"

For queries about recent events or developments, consider the current date (${currentDate.toLocaleDateString()}) when refining the query.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const refinedQuery = response.choices[0]?.message?.content?.replace(/^["']|["']$/g, '') || query;

      return NextResponse.json({ refinedQuery });
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to refine query', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
