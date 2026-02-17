import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(uri?: string): Promise<Db> {
  if (db) return db;

  const mongoUri = uri || process.env.MONGO_URI || "mongodb://localhost:27017/chat-app";
  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db();

  console.log(`Connected to MongoDB: ${mongoUri}`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
