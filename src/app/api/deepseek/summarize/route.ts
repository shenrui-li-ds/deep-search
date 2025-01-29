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
            role: 'user',
            content: `You are a helpful assistant that generates clear, accurate summaries from web search results. Please provide your response in two parts:

1. REASONING: First, explain your thought process and how you're analyzing the information.
2. SUMMARY: Then, provide a clear, well-structured summary of the information, using markdown formatting and citing sources when appropriate.

Please analyze these search results:

${formattedResults}`,
          },
        ],
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Split the content into reasoning and summary
    const reasoningMatch = content.match(/REASONING:([\s\S]*?)(?=SUMMARY:)/i);
    const summaryMatch = content.match(/SUMMARY:([\s\S]*)/i);
    
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
    const summary = summaryMatch ? summaryMatch[1].trim() : content;

    return NextResponse.json({ summary, reasoning });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
