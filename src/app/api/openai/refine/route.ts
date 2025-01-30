import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { refineSearchQueryPrompt } from '@/lib/prompts';
import { getCurrentDate } from '@/lib/utils';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { query, model = 'chatgpt-4o-latest' } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: refineSearchQueryPrompt(query, getCurrentDate()),
        },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const refinedQuery = response.choices[0]?.message?.content;

    if (!refinedQuery) {
      return NextResponse.json(
        { error: 'Failed to refine query' },
        { status: 500 }
      );
    }

    // Strip double quotes from the refined query
    const cleanedQuery = refinedQuery.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({
      refined_query: cleanedQuery,
      explanation: 'Query refined for better search results',
    });
  } catch (error: any) {
    console.error('Error in refine route:', error);
    return NextResponse.json(
      { error: 'Failed to refine query' },
      { status: 500 }
    );
  }
}
