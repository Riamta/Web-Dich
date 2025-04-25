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

    // Use in-memory storage by default
    inMemoryPageViews[path] = (inMemoryPageViews[path] || 0) + 1;
    const result = { path, views: inMemoryPageViews[path] };

    // If MongoDB is available, also update the database
    if (useMongoDB) {
      try {
        const client = await getMongoClient();
        if (client) {
          const db = client.db();
          const collection = db.collection<PageView>('pageViews');

          await collection.findOneAndUpdate(
            { path },
            { 
              $inc: { views: 1 },
              $set: { lastUpdated: new Date() }
            },
            { 
              upsert: true
            }
          );
          
          await client.close();
        }
      } catch (error) {
        console.error('Error updating MongoDB:', error);
        // Continue with in-memory result even if MongoDB update fails
      }
    }

    console.log(`Successfully tracked page view for path: ${path}`);
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
    
    // Always use in-memory storage for reading
    const pageViews = Object.entries(inMemoryPageViews).map(([path, views]) => ({
      path,
      views,
      lastUpdated: new Date()
    }));

    // If MongoDB is available, try to sync with the database
    if (useMongoDB) {
      try {
        const client = await getMongoClient();
        if (client) {
          const db = client.db();
          const collection = db.collection<PageView>('pageViews');
          
          const dbPageViews = await collection.find({}).toArray();
          
          // Update in-memory storage with database values
          for (const pv of dbPageViews) {
            if (pv.path) {
              inMemoryPageViews[pv.path] = pv.views || 0;
            }
          }
          
          await client.close();
        }
      } catch (error) {
        console.error('Error syncing with MongoDB:', error);
        // Continue with in-memory data even if MongoDB sync fails
      }
    }

    console.log(`Successfully fetched ${pageViews.length} page views`);
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