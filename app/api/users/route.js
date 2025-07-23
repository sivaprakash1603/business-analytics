import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo'; 

export async function POST(req) {
  console.log('[API] /api/users POST called');
  try {
    const body = await req.json();
    console.log('[API] Request body:', body);
    const { userId, email, companyName } = body;
    if (!userId) {
      console.error('[API] Missing userId');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const users = db.collection('user');

    let user = await users.findOne({ supabaseId: userId });
    if (!user) {
      const doc = { supabaseId: userId, email };
      if (companyName) doc.companyName = companyName;
      await users.insertOne(doc);
      console.log('[API] User inserted:', doc);
    } else {
      console.log('[API] User already exists:', user);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
