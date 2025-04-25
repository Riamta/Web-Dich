import { MongoClient } from 'mongodb'

// Default to a mock client if no URI is provided
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient | null> | null = null

export async function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB URI not found. Using mock client.')
    return null
  }

  if (clientPromise) {
    return clientPromise
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI)
    clientPromise = client.connect()
    return clientPromise
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    return null
  }
}

export default getMongoClient 