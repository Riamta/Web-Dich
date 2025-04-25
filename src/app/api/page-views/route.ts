import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { PageView } from '@/models/PageView';

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const client = await clientPromise;
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
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<PageView>('pageViews');
    
    const pageViews = await collection.find({}).toArray();
    return NextResponse.json(pageViews);
  } catch (error) {
    console.error('Error fetching page views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 