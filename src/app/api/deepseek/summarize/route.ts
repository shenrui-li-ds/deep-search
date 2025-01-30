import { NextResponse } from 'next/server';
import { summarizeSearchResultsPrompt, generateRelatedSearchesPrompt } from '@/lib/prompts';
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

    const { query, results } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!results?.length) {
      return NextResponse.json({ error: 'No results to summarize' }, { status: 400 });
    }

    // First, generate the summary
    const summaryResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: summarizeSearchResultsPrompt(query, getCurrentDate()),
          },
          {
            role: 'user',
            content: JSON.stringify(results),
          },
        ],
        temperature: 1.0,
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate summary with DeepSeek API');
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices?.[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Then, generate related searches based on the summary
    const relatedSearchesResponse = await fetch(DEEPSEEK_API_URL, {
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
            content: generateRelatedSearchesPrompt(summary),
          },
        ],
        temperature: 0.9,
      }),
    });

    if (!relatedSearchesResponse.ok) {
      throw new Error('Failed to generate related searches with DeepSeek API');
    }

    const relatedSearchesData = await relatedSearchesResponse.json();
    let relatedSearches = [];
    try {
      const relatedSearchesContent = relatedSearchesData.choices?.[0]?.message?.content;
      if (relatedSearchesContent) {
        relatedSearches = JSON.parse(relatedSearchesContent);
      }
    } catch (error) {
      console.error('Failed to parse related searches:', error);
    }

    return NextResponse.json({
      answer: summary,
      relatedSearches,
    });
  } catch (error: any) {
    console.error('Error in summarize route:', error);
    return NextResponse.json(
      { error: 'Failed to summarize results' },
      { status: 500 }
    );
  }
}
