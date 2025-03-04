import { NextResponse } from 'next/server';

// Debug logging for environment variables
console.log('==== TAVILY API DEBUG ====');
console.log('Raw env var:', process.env.TAVILY_API_KEY ? 'exists' : 'missing');
const TAVILY_API_KEY = process.env.TAVILY_API_KEY?.trim();
console.log('Processed key:', {
  exists: !!TAVILY_API_KEY,
  length: TAVILY_API_KEY?.length,
  prefix: TAVILY_API_KEY?.slice(0, 5),
  hasSpaces: TAVILY_API_KEY?.includes(' '),
});
console.log('========================');

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
    console.log('Received query:', query);

    if (!query) {
      console.error('Query is missing from request');
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const requestBody = {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_images: true,
      max_results: 10,
    };

    console.log('Making Tavily API request:', {
      url: TAVILY_API_URL,
      body: {
        ...requestBody,
        api_key: `${TAVILY_API_KEY.slice(0, 5)}...`,
      },
    });

    // Search with Tavily API
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Tavily API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Tavily API key. Please check your TAVILY_API_KEY in .env.local' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to get search results from Tavily: ${errorData.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Tavily API response:', {
      hasResults: !!data.results,
      resultCount: data.results?.length || 0,
    });
    
    if (!data.results) {
      console.error('Invalid response format from Tavily:', data);
      return NextResponse.json(
        { error: 'Invalid response format from Tavily' },
        { status: 500 }
      );
    }

    // Format the results to match our expected structure
    const formattedResults = data.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
    }));

    // Extract images from Tavily response
    const images = data.images?.map((imageUrl: string) => ({
      url: imageUrl,
      title: ''  // We don't have titles in this format
    })) || [];

    return NextResponse.json({ 
      results: formattedResults,
      images
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
