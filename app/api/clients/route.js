import { connectToDatabase } from "@/lib/mongo";
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

export async function POST(req) {
  console.log('[API] /api/clients POST called');
  try {
    const body = await req.json();
    console.log('[API] Request body:', body);
    // Support both plaintext and encrypted payloads.
    // If payload is encrypted, expect: { __encrypted: true, encrypted: { ciphertext, iv, salt, ... }, createdAt, userId }
    let name, company, description, email;
    const { createdAt, userId } = body;

    if (body.__encrypted) {
      // Don't attempt to decrypt on server — store encrypted blob as provided
      if (!body.encrypted || !userId) {
        console.error('[API] Missing encrypted payload or userId')
        return NextResponse.json({ error: 'Missing encrypted payload or userId' }, { status: 400 });
      }
    } else {
      ({ name, company, description, email } = body)
      if (!name || !company || !userId) {
        console.error('[API] Missing required fields', { name, company, userId });
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
    }

    const db = await connectToDatabase();
    const clients = db.collection('clients');
    // Generate a unique clientId using MongoDB ObjectId
    const { ObjectId } = await import('mongodb');
    const clientId = new ObjectId().toString();
    const doc = body.__encrypted
      ? { encrypted: body.encrypted, __encrypted: true, createdAt, userId, clientId }
      : { name, company, description, email: email || null, createdAt, userId, clientId };
    console.log('[API] Inserting doc:', doc);
    await clients.insertOne(doc);
    console.log('[API] Client inserted successfully');
    return NextResponse.json({ success: true, clientId });
  } catch (e) {
    console.error('[API] Error:', e);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, userId, __encrypted, encrypted } = body
    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 });
    }
    if (!__encrypted || !encrypted) {
      return NextResponse.json({ error: 'Only encrypted updates supported and encrypted payload required' }, { status: 400 });
    }
    const db = await connectToDatabase();
    const clients = db.collection('clients');
    const result = await clients.updateOne({ _id: new ObjectId(id), userId }, { $set: { __encrypted: true, encrypted } });
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Client not found or not updated' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
