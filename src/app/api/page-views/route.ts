import { NextResponse } from 'next/server';
import { getMongoClient, inMemoryPageViews, isMongoDBAvailable } from '@/lib/mongodb';
import { PageView } from '@/models/PageView';

// Check if MongoDB is available at startup
let useMongoDB = false;
isMongoDBAvailable().then(available => {
  useMongoDB = available;
  console.log(`Using ${useMongoDB ? 'MongoDB' : 'in-memory storage'} for page views`);
});

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    console.log(`Tracking page view for path: ${path}`);

    // Try to use MongoDB first
    if (useMongoDB) {
      try {
        const client = await getMongoClient();
        if (client) {
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
          
          await client.close();
          
          // Update in-memory storage as backup
          if (result && result.path) {
            inMemoryPageViews[result.path] = result.views || 0;
          }
          
          console.log(`Successfully tracked page view in MongoDB for path: ${path}`);
          return NextResponse.json(result);
        }
      } catch (error) {
        console.error('Error updating MongoDB:', error);
        // Fall back to in-memory storage if MongoDB fails
      }
    }

    // Fallback to in-memory storage
    console.log(`Using in-memory storage for path: ${path}`);
    inMemoryPageViews[path] = (inMemoryPageViews[path] || 0) + 1;
    const result = { path, views: inMemoryPageViews[path] };
    
    console.log(`Successfully tracked page view in memory for path: ${path}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('Fetching page views');
    
    // Try to use MongoDB first
    if (useMongoDB) {
      try {
        const client = await getMongoClient();
        if (client) {
          const db = client.db();
          const collection = db.collection<PageView>('pageViews');
          
          const pageViews = await collection.find({}).toArray();
          
          // Update in-memory storage as backup
          for (const pv of pageViews) {
            if (pv.path) {
              inMemoryPageViews[pv.path] = pv.views || 0;
            }
          }
          
          await client.close();
          
          console.log(`Successfully fetched ${pageViews.length} page views from MongoDB`);
          return NextResponse.json(pageViews);
        }
      } catch (error) {
        console.error('Error fetching from MongoDB:', error);
        // Fall back to in-memory storage if MongoDB fails
      }
    }

    // Fallback to in-memory storage
    console.log('Using in-memory storage for page views');
    const pageViews = Object.entries(inMemoryPageViews).map(([path, views]) => ({
      path,
      views,
      lastUpdated: new Date()
    }));
    
    console.log(`Successfully fetched ${pageViews.length} page views from memory`);
    return NextResponse.json(pageViews);
  } catch (error) {
    console.error('Error fetching page views:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      pageViews: [] // Return empty array as fallback
    }, { status: 500 });
  }
} 