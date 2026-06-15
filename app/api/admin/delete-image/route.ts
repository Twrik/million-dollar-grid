import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '../_auth';

export async function POST(req: NextRequest) {
  const { adminClient, forbidden } = await getAdminClient();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { reportId, cell_x, cell_y } = body;
  if (typeof reportId !== 'string' || typeof cell_x !== 'number' || typeof cell_y !== 'number') {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  await adminClient!.from('cells').update({ image_url: null }).eq('x', cell_x).eq('y', cell_y);
  await adminClient!.from('reports').delete().eq('id', reportId);
  return NextResponse.json({ ok: true });
}
