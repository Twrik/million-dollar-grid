import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../_auth';

export async function POST(req: NextRequest) {
  const { adminClient, forbidden } = await getAdminClient();
  if (forbidden) return forbidden;

  const { reportId, commentId } = await req.json();
  if (typeof reportId !== 'string' || typeof commentId !== 'string') {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  await adminClient!.from('comments').delete().eq('id', commentId);
  await adminClient!.from('reports').delete().eq('id', reportId);
  return NextResponse.json({ ok: true });
}
