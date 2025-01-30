import { NextResponse } from 'next/server';
import { summarizeSearchResultsPrompt } from '@/lib/prompts';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface SearchResult {
  url: string;
  title: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      );
    }

    const { query, results } = await req.json();

    if (!query || !results?.length) {
      return NextResponse.json(
        { error: 'Query and search results are required' },
        { status: 400 }
      );
    }

    // Prepare context from search results
    const context = results
      .map((result: any, index: number) => 
        `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.snippet}`
      )
      .join('\n\n');

    console.log('Making DeepSeek summarize request:', {
      context: context.slice(0, 100) + '...',
      resultCount: results.length,
    });

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
            content: summarizeSearchResultsPrompt(query, new Date().toISOString())
          },
          {
            role: 'user',
            content: `Here are the search results to analyze:\n\n${context}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to call DeepSeek API');
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    return NextResponse.json({
      answer: data.choices[0].message.content,
      explanation: 'Summary generated based on search results'
    });
  } catch (error: any) {
    console.error('Error in summarize route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize results' },
      { status: 500 }
    );
  }
}
