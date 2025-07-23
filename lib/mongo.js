import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
let client

export async function connectToDatabase() {
  if (!uri) throw new Error("Missing MONGODB_URI environment variable")
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  // Use database name from env or default to 'business-analytics'
  const dbName = process.env.MONGODB_DB || "business-analytics"
  return client.db(dbName)
}
