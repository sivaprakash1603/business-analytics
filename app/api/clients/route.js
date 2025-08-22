import { connectToDatabase } from "@/lib/mongo";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const db = await connectToDatabase();
    const clients = db.collection('clients');
    const allClients = await clients.find({ userId }).toArray();
    return NextResponse.json({ clients: allClients });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
import { ObjectId } from 'mongodb';
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
    }
    const db = await connectToDatabase();
    const clients = db.collection('clients');
    const result = await clients.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log('[API] /api/clients POST called');
  try {
    const body = await req.json();
    console.log('[API] Request body:', body);
    const { name, company, description, createdAt, userId } = body;
    if (!name || !company || !userId) {
      console.error('[API] Missing required fields', { name, company, userId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const clients = db.collection('clients');
    // Generate a unique clientId using MongoDB ObjectId
    const { ObjectId } = await import('mongodb');
    const clientId = new ObjectId().toString();
    const doc = { name, company, description, createdAt, userId, clientId };
    console.log('[API] Inserting doc:', doc);
    await clients.insertOne(doc);
    console.log('[API] Client inserted successfully');
    return NextResponse.json({ success: true, clientId });
  } catch (e) {
    console.error('[API] Error:', e);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
