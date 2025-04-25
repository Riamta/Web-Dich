import { MongoClient } from 'mongodb'

// In-memory storage for page views when MongoDB is not available
export const inMemoryPageViews: Record<string, number> = {};

// Simple function to check if MongoDB is available
export async function isMongoDBAvailable(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
    console.log('MongoDB URI not found. Using in-memory storage.');
    return false;
  }

  try {
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 0
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
  if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
    return null;
  }

  try {
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 0
    });
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null;
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