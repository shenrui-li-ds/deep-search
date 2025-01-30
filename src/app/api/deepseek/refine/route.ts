import { NextResponse } from 'next/server';
import { refineSearchQueryPrompt } from '@/lib/prompts';
import { getCurrentDate } from '@/lib/utils';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

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
            content: refineSearchQueryPrompt(query, getCurrentDate()),
          },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to call DeepSeek API');
    }

    const data = await response.json();
    const refinedQuery = data.choices?.[0]?.message?.content;

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
