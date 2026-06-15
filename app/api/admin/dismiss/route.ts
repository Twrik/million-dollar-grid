import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../_auth';

export async function POST(req: NextRequest) {
  const { adminClient, forbidden } = await getAdminClient();
  if (forbidden) return forbidden;

  const { reportId } = await req.json();
  if (!reportId || typeof reportId !== 'string') {
    return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
  }

  await adminClient!.from('reports').delete().eq('id', reportId);
  return NextResponse.json({ ok: true });
}
