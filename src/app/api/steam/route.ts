import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  
  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching data for app ID: ${appId}`);

    // Fetch from Steam API
    const steamResponse = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=VN&l=vietnamese`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (!steamResponse.ok) {
      throw new Error('Failed to fetch from Steam API');
    }

    const data = await steamResponse.json();
    console.log('Steam API response received');
    
    // Fetch multiple pages to get all images
    const pages = [
      `https://store.steampowered.com/app/${appId}/`, // Main store page
      `https://steamcommunity.com/app/${appId}/`, // Community page
      `https://steamcommunity.com/app/${appId}/screenshots/`, // Screenshots page
      `https://steamcommunity.com/app/${appId}/workshop/`, // Workshop page
      `https://steamcommunity.com/app/${appId}/achievements/`, // Achievements page
    ];

    const allImages = new Set<string>();
    const allMovies = new Set<string>();

    // Fetch all pages concurrently
    const pagePromises = pages.map(async (url, index) => {
      try {
        console.log(`Fetching page ${index + 1}: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const html = await response.text();
        console.log(`Page ${index + 1} fetched, length: ${html.length}`);
        return { url, html, success: true };
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return { url, html: '', success: false };
      }
    });

    const pageResults = await Promise.all(pagePromises);

    // Extract all types of images from all pages
    pageResults.forEach((result, index) => {
      if (!result.success || !result.html) {
        console.log(`Skipping page ${index + 1} due to fetch failure`);
        return;
      }

      console.log(`Processing page ${index + 1}: ${result.url}`);

      // More comprehensive image patterns
      const imagePatterns = [
        // Screenshots
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/ss_[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Header images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/header[^"'\s]*\.(jpg|png|webp|jpeg)/gi,
        // Library images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/library_[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Achievement images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/achievements\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Workshop images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/workshop\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Community images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/community\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Any Steam CDN images
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Alternative Steam CDN
        /https:\/\/steamcdn-a\.akamaihd\.net\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
        // Steam CDN with different subdomain
        /https:\/\/cdn\.steamstatic\.com\/[^"'\s]+\.(jpg|png|webp|jpeg)/gi,
      ];

      // Movie patterns
      const moviePatterns = [
        /https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/movie[^"'\s]+\.(webm|mp4|avi)/gi,
        /https:\/\/steamcdn-a\.akamaihd\.net\/[^"'\s]+\.(webm|mp4|avi)/gi,
        /https:\/\/cdn\.steamstatic\.com\/[^"'\s]+\.(webm|mp4|avi)/gi,
      ];

      // Extract images
      imagePatterns.forEach(pattern => {
        const matches = result.html.match(pattern);
        if (matches) {
          console.log(`Found ${matches.length} images with pattern: ${pattern.source}`);
          matches.forEach(match => {
            // Clean up the URL
            const cleanUrl = match.replace(/['"]/g, '');
            if (cleanUrl.includes(`/steam/apps/${appId}/`) || cleanUrl.includes('/steam/workshop/') || cleanUrl.includes('/steam/community/')) {
              allImages.add(cleanUrl);
            }
          });
        }
      });

      // Extract movies
      moviePatterns.forEach(pattern => {
        const matches = result.html.match(pattern);
        if (matches) {
          console.log(`Found ${matches.length} movies with pattern: ${pattern.source}`);
          matches.forEach(match => {
            const cleanUrl = match.replace(/['"]/g, '');
            allMovies.add(cleanUrl);
          });
        }
      });

      // Look for images in JSON data embedded in HTML
      const jsonMatches = result.html.match(/https:\/\/cdn\.akamai\.steamstatic\.com[^"'\s]+\.(jpg|png|webp|jpeg)/gi);
      if (jsonMatches) {
        console.log(`Found ${jsonMatches.length} images in JSON data`);
        jsonMatches.forEach(match => {
          const cleanUrl = match.replace(/['"]/g, '');
          if (cleanUrl.includes(`/steam/apps/${appId}/`)) {
            allImages.add(cleanUrl);
          }
        });
      }

      // Look for images in data attributes
      const dataAttrMatches = result.html.match(/data-[^=]+="[^"]*https:\/\/cdn\.akamai\.steamstatic\.com[^"]+\.(jpg|png|webp|jpeg)[^"]*"/gi);
      if (dataAttrMatches) {
        console.log(`Found ${dataAttrMatches.length} images in data attributes`);
        dataAttrMatches.forEach(match => {
          const urlMatch = match.match(/https:\/\/cdn\.akamai\.steamstatic\.com[^"'\s]+\.(jpg|png|webp|jpeg)/i);
          if (urlMatch) {
            const cleanUrl = urlMatch[0].replace(/['"]/g, '');
            if (cleanUrl.includes(`/steam/apps/${appId}/`)) {
              allImages.add(cleanUrl);
            }
          }
        });
      }
    });

    // Convert to arrays and sort
    const uniqueImages = Array.from(allImages).sort();
    const uniqueMovies = Array.from(allMovies).sort();

    console.log(`Total unique images found: ${uniqueImages.length}`);
    console.log(`Total unique movies found: ${uniqueMovies.length}`);
    console.log('Sample images:', uniqueImages.slice(0, 5));

    // Fallback: If no images found, try to get screenshots from Steam API
    if (uniqueImages.length <= 1 && data[appId]?.success) {
      console.log('Fallback: Trying to get screenshots from Steam API...');
      try {
        // Try to get screenshots from Steam API
        const screenshotsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=screenshots&cc=VN&l=vietnamese`);
        const screenshotsData = await screenshotsResponse.json();
        
        if (screenshotsData[appId]?.success && screenshotsData[appId].data?.screenshots) {
          const apiScreenshots = screenshotsData[appId].data.screenshots.map((screenshot: any) => screenshot.path_full);
          console.log(`Found ${apiScreenshots.length} screenshots from API`);
          apiScreenshots.forEach((url: string) => uniqueImages.push(url));
        }
      } catch (error) {
        console.error('Fallback API call failed:', error);
      }
    }

    return NextResponse.json({
      ...data,
      screenshots: uniqueImages,
      movies: uniqueMovies,
      totalImages: uniqueImages.length,
      totalMovies: uniqueMovies.length
    });

  } catch (error) {
    console.error('Steam API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game data' },
      { status: 500 }
    );
  }
} 