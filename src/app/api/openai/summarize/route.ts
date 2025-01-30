import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { summarizeSearchResultsPrompt } from '@/lib/prompts';

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

    const { query, results, model = 'gpt-4o' } = await req.json();

    if (!results?.length) {
      return NextResponse.json(
        { error: 'Search results are required' },
        { status: 400 }
      );
    }

    // Prepare context from search results
    const context = results
      .map((result: any, index: number) => 
        `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.snippet}`
      )
      .join('\n\n');

    console.log('Making OpenAI summarize request:', {
      model,
      context: context.slice(0, 100) + '...',
      resultCount: results.length,
    });

    const response = await openai.chat.completions.create({
      model: model,
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
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('Invalid response format from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer: content,
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
