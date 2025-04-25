import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { PageView } from '@/models/PageView';

// In-memory fallback for when MongoDB is not available
let inMemoryPageViews: Record<string, number> = {};

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const client = await getMongoClient();
    
    if (client) {
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

      return NextResponse.json(result);
    } else {
      // Fallback to in-memory storage
      inMemoryPageViews[path] = (inMemoryPageViews[path] || 0) + 1;
      return NextResponse.json({ path, views: inMemoryPageViews[path] });
    }
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
    const client = await getMongoClient();
    
    if (client) {
      // Use MongoDB if available
      const db = client.db();
      const collection = db.collection<PageView>('pageViews');
      
      const pageViews = await collection.find({}).toArray();
      return NextResponse.json(pageViews);
    } else {
      // Fallback to in-memory storage
      const pageViews = Object.entries(inMemoryPageViews).map(([path, views]) => ({
        path,
        views,
        lastUpdated: new Date()
      }));
      return NextResponse.json(pageViews);
    }
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