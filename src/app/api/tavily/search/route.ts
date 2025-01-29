import { NextResponse } from 'next/server';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY?.trim();
const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!TAVILY_API_KEY) {
      console.error('Tavily API key is not configured');
      return NextResponse.json(
        { error: 'Tavily API key is not configured. Please add TAVILY_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Log request details (remove in production)
    console.log('Making Tavily API request with key:', TAVILY_API_KEY.slice(0, 4) + '...');

    // Search with Tavily API
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        include_images: false,
        max_results: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Tavily API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Tavily API key. Please check your TAVILY_API_KEY in .env.local and ensure it does not have quotes or extra spaces.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Tavily API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tavily search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
