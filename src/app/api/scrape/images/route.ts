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
    $('article img, .content img, main img, img').each((_, element) => {
      const img = $(element);
      // Check multiple possible image source attributes
      const src = img.attr('data-src') || img.attr('src') || img.attr('srcset') || '';
      const alt = img.attr('alt') || '';
      const caption = img.parent().text().trim();
      const width = parseInt(img.attr('width') || '0');
      const height = parseInt(img.attr('height') || '0');
      
      // Skip if no source
      if (!src) return;
      
      // Skip tiny images (likely icons)
      if (width > 0 && width < 100) return;
      if (height > 0 && height < 100) return;
      
      // Convert relative URLs to absolute
      const absoluteSrc = new URL(src, url).href;
      
      // Skip SVG images
      if (absoluteSrc.toLowerCase().endsWith('.svg')) return;
      
      // Skip common non-content images
      if (absoluteSrc.toLowerCase().includes('logo') ||
          absoluteSrc.toLowerCase().includes('avatar') ||
          absoluteSrc.toLowerCase().includes('icon') ||
          absoluteSrc.includes('ads.') || 
          absoluteSrc.includes('tracking.') || 
          absoluteSrc.includes('pixel.') ||
          absoluteSrc.includes('analytics.')) {
        return;
      }

      // If the image has a caption or alt text, it's more likely to be content-relevant
      const hasMetadata = alt.length > 0 || caption.length > 0;
      
      images.push({ 
        src: absoluteSrc,
        alt: alt || caption // Use caption as fallback for alt text
      });
    });
    
    // Return only the first few relevant images, prioritizing those with metadata
    return images
      .sort((a, b) => (b.alt?.length || 0) - (a.alt?.length || 0))
      .slice(0, 3);
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
