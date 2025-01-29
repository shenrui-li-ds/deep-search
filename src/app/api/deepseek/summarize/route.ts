import { NextResponse } from 'next/server';

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

    const { searchResults } = await req.json();

    if (!searchResults || !Array.isArray(searchResults)) {
      return NextResponse.json(
        { error: 'Search results are required and must be an array' },
        { status: 400 }
      );
    }

    const formattedResults = searchResults
      .map((result: SearchResult, index: number) => 
        `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.content}\n`
      )
      .join('\n');

    const response = await fetch(DEEPSEEK_API_URL, {
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
            content: 'You are a helpful AI assistant that provides accurate summaries based on search results. First analyze and reason about the information, then provide a clear and concise answer.',
          },
          {
            role: 'user',
            content: `Please analyze these search results and provide a comprehensive answer:\n\n${formattedResults}`,
          },
        ],
        max_tokens: 10000,
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;
    
    return NextResponse.json({
      summary: message.content,
      reasoning: message.reasoning_content || '',
    });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
