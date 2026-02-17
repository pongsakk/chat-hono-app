// Placeholder สำหรับการเชื่อมต่อ MongoDB
// ใช้ตัวแปร environment MONGO_URI

let db: any = null;

export async function connectToDatabase(uri?: string) {
  const mongoUri = uri || process.env.MONGO_URI || "mongodb://localhost:27017";
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  // TODO: เชื่อมต่อจริงด้วย mongodb driver
  // const client = new MongoClient(mongoUri);
  // await client.connect();
  // db = client.db("chat-app");
  console.log("MongoDB connected (mock)");
}

export function getDb() {
  return db;
}
