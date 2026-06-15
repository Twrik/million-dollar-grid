import { NextResponse } from 'next/server';
import { getAdminClient } from '../_auth';

export async function GET() {
  const { adminClient, forbidden } = await getAdminClient();
  if (forbidden) return forbidden;

  const { data: reports } = await adminClient!
    .from('reports')
    .select('id, cell_x, cell_y, reason, created_at')
    .order('created_at', { ascending: false });

  if (!reports) return NextResponse.json([]);

  const enriched = await Promise.all(
    reports.map(async (r) => {
      if (r.reason.startsWith('[Comment:')) {
        return { ...r, image_url: null, owner_name: null };
      }
      const { data: cell } = await adminClient!
        .from('cells')
        .select('image_url, owner_name')
        .eq('x', r.cell_x)
        .eq('y', r.cell_y)
        .maybeSingle();
      return { ...r, image_url: cell?.image_url ?? null, owner_name: cell?.owner_name ?? null };
    })
  );

  return NextResponse.json(enriched);
}
