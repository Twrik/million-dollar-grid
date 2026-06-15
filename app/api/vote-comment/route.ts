import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });
  }

  const { commentId, likeDelta, dislikeDelta } = await req.json();

  if (
    typeof commentId !== 'string' ||
    ![- 1, 0, 1].includes(likeDelta) ||
    ![-1, 0, 1].includes(dislikeDelta)
  ) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: comment } = await adminClient
    .from('comments')
    .select('likes, dislikes')
    .eq('id', commentId)
    .maybeSingle();

  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, number> = {};
  if (likeDelta !== 0) updates.likes = Math.max(0, comment.likes + likeDelta);
  if (dislikeDelta !== 0) updates.dislikes = Math.max(0, comment.dislikes + dislikeDelta);

  await adminClient.from('comments').update(updates).eq('id', commentId);
  return NextResponse.json({ ok: true });
}
