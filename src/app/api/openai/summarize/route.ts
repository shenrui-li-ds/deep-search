import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { summarizeSearchResultsPrompt, generateRelatedSearchesPrompt } from '@/lib/prompts';
import { getCurrentDate } from '@/lib/utils';

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
        { error: 'OpenAI API key is not configured' },
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
    const summaryResponse = await openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
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
    });

    const summary = summaryResponse.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Then, generate related searches based on the summary
    const relatedSearchesResponse = await openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: [
        {
          role: 'system',
          content: generateRelatedSearchesPrompt(summary),
        },
      ],
      temperature: 0.9,
    });

    let relatedSearches = [];
    try {
      const relatedSearchesContent = relatedSearchesResponse.choices[0]?.message?.content;
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
      { error: error.message || 'Failed to summarize results' },
      { status: 500 }
    );
  }
}
