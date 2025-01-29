import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function scrapeImagesFromUrl(url: string) {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const images: { src: string; alt: string }[] = [];
    
    // Find relevant images (excluding tiny icons, ads, etc.)
    $('img').each((_, element) => {
      const img = $(element);
      const src = img.attr('src');
      const alt = img.attr('alt') || '';
      const width = parseInt(img.attr('width') || '0');
      const height = parseInt(img.attr('height') || '0');
      
      // Skip if no source
      if (!src) return;
      
      // Skip tiny images (likely icons)
      if (width > 0 && width < 100) return;
      if (height > 0 && height < 100) return;
      
      // Convert relative URLs to absolute
      const absoluteSrc = new URL(src, url).href;
      
      // Skip common ad/tracking domains
      if (absoluteSrc.includes('ads.') || 
          absoluteSrc.includes('tracking.') || 
          absoluteSrc.includes('pixel.') ||
          absoluteSrc.includes('analytics.')) {
        return;
      }
      
      images.push({ 
        src: absoluteSrc,
        alt 
      });
    });
    
    // Return only the first few relevant images
    return images.slice(0, 3);
  } catch (error) {
    console.error(`Error scraping images from ${url}:`, error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs must be provided as an array' },
        { status: 400 }
      );
    }

    // Scrape images from all URLs in parallel
    const results = await Promise.allSettled(
      urls.map(async (url) => ({
        url,
        images: await scrapeImagesFromUrl(url)
      }))
    );

    // Filter out failures and empty results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<{url: string; images: {src: string; alt: string}[]}> => 
        result.status === 'fulfilled' && result.value.images.length > 0
      )
      .map(result => result.value);

    return NextResponse.json({ results: successfulResults });
  } catch (error) {
    console.error('Image scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape images' },
      { status: 500 }
    );
  }
}
