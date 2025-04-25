import { MongoClient } from 'mongodb'

// In-memory storage for page views when MongoDB is not available
export const inMemoryPageViews: Record<string, number> = {};

// Get MongoDB client if available
export async function getMongoClient() {
  if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
    console.log('MongoDB URI not found');
    return null;
  }

  try {
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
      ssl: true,
      tls: true,
      tlsCAFile: undefined,
      tlsAllowInvalidHostnames: true,
      retryWrites: true,
      retryReads: true,
      directConnection: false,
      replicaSet: 'atlas-qkwesz-shard-0'
    });
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null;
  }
}

// Simple function to check if MongoDB is available
export async function isMongoDBAvailable(): Promise<boolean> {
  const client = await getMongoClient();
  if (!client) {
    return false;
  }
  
  try {
    await client.close();
    return true;
  } catch (error) {
    console.error('Error checking MongoDB availability:', error);
    return false;
  }
}

// Function to load page views from localStorage (client-side only)
export function loadPageViewsFromStorage(): Record<string, number> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pageViews');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading page views from localStorage:', error);
    }
  }
  return {};
}

// Function to save page views to localStorage (client-side only)
export function savePageViewsToStorage(pageViews: Record<string, number>): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pageViews', JSON.stringify(pageViews));
    } catch (error) {
      console.error('Error saving page views to localStorage:', error);
    }
  }
}

export default { 
  isMongoDBAvailable, 
  getMongoClient, 
  inMemoryPageViews,
  loadPageViewsFromStorage,
  savePageViewsToStorage
}; 