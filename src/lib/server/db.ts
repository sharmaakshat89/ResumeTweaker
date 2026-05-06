import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

const uri = env.MONGO_URI || "";
if (!uri) {
  console.error("CRITICAL: MONGO_URI is missing from environment.");
}

// Global cached connection for Serverless environments (Vercel)
let cachedClient: MongoClient | null = null;
let cachedPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  
  if (!cachedPromise) {
    console.log(">>> Establishing new MongoDB connection...");
    const client = new MongoClient(uri, {
      tls: true, // Explicitly enable TLS
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedPromise = client.connect().then((client) => {
      console.log(">>> MongoDB Connected Successfully");
      cachedClient = client;
      return client;
    });
  }
  
  return cachedPromise;
}

export async function getDb() {
  try {
    const client = await getMongoClient();
    return client.db('ResumeApp');
  } catch (e) {
    console.error(">>> getDb() Failed:", e);
    throw e;
  }
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection('users');
}
