import { MongoClient } from 'mongodb'

// Default to a mock client if no URI is provided
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient | null> | null = null
let isConnecting = false

export async function getMongoClient() {
  // If no URI is provided, return null immediately
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB URI not found. Using mock client.')
    return null
  }

  // If we already have a connection promise, return it
  if (clientPromise) {
    return clientPromise
  }

  // If we're already trying to connect, don't start another connection attempt
  if (isConnecting) {
    console.log('MongoDB connection already in progress. Waiting...')
    return clientPromise
  }

  try {
    isConnecting = true
    console.log('Attempting to connect to MongoDB...')
    
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
      client.connect().then(connectedClient => {
        console.log('Successfully connected to MongoDB')
        isConnecting = false
        return connectedClient
      }),
      new Promise<null>((_, reject) => 
        setTimeout(() => {
          console.warn('MongoDB connection timed out. Using mock client.')
          isConnecting = false
          reject(null)
        }, 5000)
      )
    ]).catch(error => {
      console.error('Error connecting to MongoDB:', error)
      isConnecting = false
      return null
    })
    
    return clientPromise
  } catch (error) {
    console.error('Error setting up MongoDB connection:', error)
    isConnecting = false
    return null
  }
}

export default getMongoClient 