import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const FETCH_TIMEOUT = 3000; // Reduce timeout to 3 seconds
const MAX_URLS_PER_REQUEST = 5; // Limit number of URLs to scrape
const MAX_IMAGES_PER_URL = 3; // Limit images per URL

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; DeepSearch/1.0;)'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function scrapeImagesFromUrl(url: string): Promise<Array<{ src: string; alt: string }>> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const images: { src: string; alt: string; score: number }[] = [];
    
    // Find relevant images (excluding tiny icons, ads, etc.)
    $('article img, .content img, main img, .post img, img').each((_, element) => {
      const img = $(element);
      const src = img.attr('data-src') || img.attr('src') || img.attr('srcset')?.split(' ')[0] || '';
      const alt = img.attr('alt') || '';
      const caption = img.parent().text().trim();
      const width = parseInt(img.attr('width') || '0');
      const height = parseInt(img.attr('height') || '0');
      
      if (!src) return;
      if (width > 0 && width < 100) return;
      if (height > 0 && height < 100) return;
      
      try {
        const absoluteSrc = new URL(src, url).href;
        
        if (absoluteSrc.toLowerCase().endsWith('.svg')) return;
        if (absoluteSrc.toLowerCase().match(/(logo|avatar|icon|ads\.|tracking\.|pixel\.|analytics)/)) return;
        
        // Score the image based on various factors
        let score = 0;
        if (alt.length > 0) score += 2;
        if (caption.length > 0) score += 1;
        if (width > 300) score += 1;
        if (height > 300) score += 1;
        if (src.includes('hero') || src.includes('featured')) score += 2;
        
        images.push({ 
          src: absoluteSrc,
          alt: alt || caption,
          score
        });
      } catch (e) {
        // Skip invalid URLs
        return;
      }
    });
    
    // Return top scored images
    return images
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_IMAGES_PER_URL)
      .map(({ src, alt }) => ({ src, alt }));
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

    // Limit number of URLs to process
    const urlsToProcess = urls.slice(0, MAX_URLS_PER_REQUEST);

    // Scrape images from all URLs in parallel with timeout
    const results = await Promise.allSettled(
      urlsToProcess.map(async (url) => ({
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
