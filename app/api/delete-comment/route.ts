import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId || typeof commentId !== 'string') {
    return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: comment } = await adminClient
    .from('comments')
    .select('user_name')
    .eq('id', commentId)
    .maybeSingle();

  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const userName = user.user_metadata?.name ?? user.email ?? '';
  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  if (comment.user_name !== userName && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await adminClient.from('comments').delete().eq('id', commentId);
  return NextResponse.json({ ok: true });
}
