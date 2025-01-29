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
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that refines search queries to make them more effective. Your goal is to make the query more specific and targeted while maintaining its original intent.',
          },
          {
            role: 'user',
            content: `Please refine this search query to make it more effective: "${query}"`,
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
