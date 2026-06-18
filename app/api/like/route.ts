import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });
  }

  const { x, y, action, userId } = await req.json();
  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    (action !== 'like' && action !== 'unlike') ||
    typeof userId !== 'string' || !userId.trim()
  ) {
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

  // Use a per-user record so the same account can't double-like across devices
  if (action === 'like') {
    const { error: insertError } = await adminClient
      .from('cell_likes')
      .insert({ user_id: userId, cell_x: x, cell_y: y });

    if (insertError) {
      // Already liked (unique constraint) — return current count unchanged
      if (insertError.code === '23505') {
        return NextResponse.json({ likes: cell.likes });
      }
      return NextResponse.json({ error: 'Could not save like' }, { status: 500 });
    }

    const newLikes = cell.likes + 1;
    await adminClient.from('cells').update({ likes: newLikes }).eq('x', x).eq('y', y);
    return NextResponse.json({ likes: newLikes });
  } else {
    const { data: deleted } = await adminClient
      .from('cell_likes')
      .delete()
      .eq('user_id', userId)
      .eq('cell_x', x)
      .eq('cell_y', y)
      .select('user_id');

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ likes: cell.likes });
    }

    const newLikes = Math.max(0, cell.likes - 1);
    await adminClient.from('cells').update({ likes: newLikes }).eq('x', x).eq('y', y);
    return NextResponse.json({ likes: newLikes });
  }
}
