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
    // Set connection timeout to 5 seconds
    const options = {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 0
    }
    
    client = new MongoClient(process.env.MONGODB_URI, options)
    
    // Set a timeout for the connection promise
    clientPromise = Promise.race([
      client.connect(),
      new Promise<null>((_, reject) => 
        setTimeout(() => {
          console.warn('MongoDB connection timed out. Using mock client.')
          reject(null)
        }, 5000)
      )
    ]).catch(error => {
      console.error('Error connecting to MongoDB:', error)
      return null
    })
    
    return clientPromise
  } catch (error) {
    console.error('Error setting up MongoDB connection:', error)
    return null
  }
}

export default getMongoClient 