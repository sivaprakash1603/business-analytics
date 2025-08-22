import {NextResponse} from 'next/server';
import {connectToDatabase} from '@/lib/mongo';
export async function GET(req) {
  console.log('[API] /api/users/getcompany GET called');
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      console.error('[API] Missing userId');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const users = db.collection('user');

    const user = await users.findOne({ supabaseId: userId });
    if (!user) {
      console.error('[API] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[API] User found:', user);
    return NextResponse.json({ companyName: user.companyName || '' });
  } catch (e) {
    console.error('[API] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}