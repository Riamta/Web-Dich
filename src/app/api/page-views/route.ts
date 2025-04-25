import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { PageView } from '@/models/PageView';

// In-memory fallback for when MongoDB is not available
let inMemoryPageViews: Record<string, number> = {};

// Set a timeout for API operations
const API_TIMEOUT = 8000; // 8 seconds

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    console.log(`Tracking page view for path: ${path}`);

    // Use Promise.race to implement a timeout
    const result = await Promise.race([
      (async () => {
        const client = await getMongoClient();
        
        if (client) {
          console.log('Using MongoDB for page view tracking');
          // Use MongoDB if available
          const db = client.db();
          const collection = db.collection<PageView>('pageViews');

          const result = await collection.findOneAndUpdate(
            { path },
            { 
              $inc: { views: 1 },
              $set: { lastUpdated: new Date() }
            },
            { 
              upsert: true,
              returnDocument: 'after'
            }
          );

          return result;
        } else {
          console.log('Using in-memory storage for page view tracking');
          // Fallback to in-memory storage
          inMemoryPageViews[path] = (inMemoryPageViews[path] || 0) + 1;
          return { path, views: inMemoryPageViews[path] };
        }
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), API_TIMEOUT)
      )
    ]);

    console.log(`Successfully tracked page view for path: ${path}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking page view:', error);
    // Always return a valid JSON response
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('Fetching page views');
    
    // Use Promise.race to implement a timeout
    const result = await Promise.race([
      (async () => {
        const client = await getMongoClient();
        
        if (client) {
          console.log('Using MongoDB for fetching page views');
          // Use MongoDB if available
          const db = client.db();
          const collection = db.collection<PageView>('pageViews');
          
          const pageViews = await collection.find({}).toArray();
          return pageViews;
        } else {
          console.log('Using in-memory storage for fetching page views');
          // Fallback to in-memory storage
          const pageViews = Object.entries(inMemoryPageViews).map(([path, views]) => ({
            path,
            views,
            lastUpdated: new Date()
          }));
          return pageViews;
        }
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), API_TIMEOUT)
      )
    ]);

    console.log(`Successfully fetched ${Array.isArray(result) ? result.length : 0} page views`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching page views:', error);
    // Always return a valid JSON response
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      pageViews: [] // Return empty array as fallback
    }, { status: 500 });
  }
} 