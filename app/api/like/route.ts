import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });
  }

  const { x, y, action } = await req.json();
  if (typeof x !== 'number' || typeof y !== 'number' || (action !== 'like' && action !== 'unlike')) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cell } = await adminClient
    .from('cells')
    .select('likes')
    .eq('x', x)
    .eq('y', y)
    .maybeSingle();

  if (!cell) return NextResponse.json({ error: 'Cell not found' }, { status: 404 });

  const newLikes = action === 'like'
    ? cell.likes + 1
    : Math.max(0, cell.likes - 1);

  await adminClient.from('cells').update({ likes: newLikes }).eq('x', x).eq('y', y);
  return NextResponse.json({ likes: newLikes });
}
