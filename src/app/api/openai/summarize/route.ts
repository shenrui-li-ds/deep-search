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

    const { searchResults, model = 'o1-mini' } = await req.json();

    if (!searchResults?.length) {
      return NextResponse.json(
        { error: 'Search results are required' },
        { status: 400 }
      );
    }

    // Prepare context from search results
    const context = searchResults
      .map((result: any) => `Source: ${result.url}\n${result.content}`)
      .join('\n\n');

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: `You are a helpful assistant that generates clear, accurate summaries from web search results. Include relevant information and cite sources when appropriate. Use markdown formatting for better readability.

Please analyze and summarize the following search results, providing clear reasoning and relevant citations:

${context}`,
          },
        ],
        max_completion_tokens: 10000,
      });

      const summary = response.choices[0]?.message?.content;
      if (!summary) {
        console.error('OpenAI API response:', JSON.stringify(response, null, 2));
        throw new Error('No summary generated');
      }

      return NextResponse.json({ summary });
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      if (error?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to generate summary' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
