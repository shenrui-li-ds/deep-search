import { NextResponse } from 'next/server';
import { summarizeSearchResultsPrompt, generateRelatedSearchesPrompt } from '@/lib/prompts';
import { getCurrentDate } from '@/lib/utils';

const ALIBABACLOUD_API_KEY = process.env.ALIBABACLOUD_API_KEY;
const ALIBABACLOUD_API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function POST(req: Request) {
  try {
    if (!ALIBABACLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'AlibabaCloud API key not configured' },
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
    const summaryResponse = await fetch(ALIBABACLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ALIBABACLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
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
      throw new Error('Failed to generate summary with AlibabaCloud API');
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    // Then, generate related searches
    const relatedResponse = await fetch(ALIBABACLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ALIBABACLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: generateRelatedSearchesPrompt(summary),
          },
        ],
        temperature: 1.0,
      }),
    });

    if (!relatedResponse.ok) {
      throw new Error('Failed to generate related searches with AlibabaCloud API');
    }

    const relatedData = await relatedResponse.json();
    let relatedSearches: { query: string }[] = [];

    try {
      const relatedContent = relatedData.choices?.[0]?.message?.content;
      if (relatedContent) {
        // Parse the JSON string and ensure it matches the expected format
        const parsed = JSON.parse(relatedContent);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && 'query' in item)) {
          relatedSearches = parsed;
        } else {
          console.error('Related searches response is not in the expected format:', parsed);
        }
      }
    } catch (error) {
      console.error('Failed to parse related searches:', error);
      // Continue without related searches
    }

    return NextResponse.json({
      answer: summary,
      sources: results,
      relatedSearches,
    });
  } catch (error: any) {
    console.error('Error in summarize results:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
