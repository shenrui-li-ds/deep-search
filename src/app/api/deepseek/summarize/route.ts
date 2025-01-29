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
            content: `You are a helpful AI assistant that generates clear, accurate summaries from web search results. Always maintain a consistent format in your responses with clear sections and proper citations. Make sure to include clickable citation links after each fact or quote.`
          },
          {
            role: 'user',
            content: `Analyze and summarize the following search results, following this exact format:

# Key Findings
Provide 2-3 bullet points of the most important takeaways. Each point should end with a citation link in the format [[Source X]](URL).

# Detailed Analysis
Provide a comprehensive analysis of the topic. Each fact or quote should be followed by a citation link in the format [[Source X]](URL) where X is the source number and URL is the actual URL from that source.

Example citation format:
"This is a direct quote or fact" [[Source 1]](https://example.com)

# References
List all sources used, numbered in order of appearance:
[Source 1] Title of Source 1 - URL
[Source 2] Title of Source 2 - URL
etc.

# Related Topics
Suggest 3 related topics that the user might be interested in, formatted as clickable markdown links:
- [First Related Topic](First Related Topic)
- [Second Related Topic](Second Related Topic)
- [Third Related Topic](Third Related Topic)

Here are the search results to analyze:

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
