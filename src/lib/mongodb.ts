import { MongoClient } from 'mongodb'

// In-memory storage for page views when MongoDB is not available
export const inMemoryPageViews: Record<string, number> = {};

// Simple function to check if MongoDB is available
export async function isMongoDBAvailable(): Promise<boolean> {
  if (!process.env.MONGODB_URI) {
    console.log('MongoDB URI not found. Using in-memory storage.');
    return false;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
    });
    
    await client.connect();
    await client.close();
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.log('MongoDB connection failed, using in-memory storage:', error);
    return false;
  }
}

// Get MongoDB client if available
export async function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
    });
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null;
  }
}

export default { isMongoDBAvailable, getMongoClient, inMemoryPageViews }; 