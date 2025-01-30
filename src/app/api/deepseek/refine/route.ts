import { NextResponse } from 'next/server';
import { refineSearchQueryPrompt } from '@/lib/prompts';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
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
            role: 'user',
            content: refineSearchQueryPrompt(query, new Date().toISOString())
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

    try {
      const result = JSON.parse(data.choices[0].message.content);
      return NextResponse.json({
        refined_query: result.refined_query,
        explanation: result.explanation
      });
    } catch (error) {
      console.error('Failed to parse DeepSeek response:', error);
      return NextResponse.json({
        refined_query: query,
        explanation: 'Using original query due to refinement error'
      });
    }
  } catch (error) {
    console.error('Error in refine route:', error);
    return NextResponse.json(
      { error: 'Failed to refine query' },
      { status: 500 }
    );
  }
}
