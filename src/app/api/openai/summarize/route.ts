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

${context}`,
          },
        ],
        max_completion_tokens: 10000,
      });

      const summary = response.choices[0]?.message?.content || '';
      return NextResponse.json({ summary, reasoning: '' });
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
