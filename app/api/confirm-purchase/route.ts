import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { sessionId, ownerName: clientOwnerName } = await req.json();
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  // Verify with Stripe that payment actually succeeded
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
  }

  const x = parseInt(session.metadata?.x ?? '', 10);
  const y = parseInt(session.metadata?.y ?? '', 10);
  const width = parseInt(session.metadata?.width ?? '1', 10);
  const height = parseInt(session.metadata?.height ?? '1', 10);

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
    return NextResponse.json({ error: 'Invalid metadata in session' }, { status: 400 });
  }

  // Get the authenticated user making this request
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await userClient.auth.getUser();

  const ownerEmail = user?.email ?? '';
  const serverName = user?.user_metadata?.name ?? user?.email ?? null;
  const ownerName = serverName ?? (typeof clientOwnerName === 'string' && clientOwnerName.trim() ? clientOwnerName.trim().slice(0, 50) : 'Anonym');

  // Use service role to bypass RLS for the insert
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if cells are already taken
  const keys: string[] = [];
  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      keys.push(`${x + dx},${y + dy}`);
    }
  }
  const orFilter = keys.map(k => {
    const [cx, cy] = k.split(',');
    return `and(x.eq.${cx},y.eq.${cy})`;
  }).join(',');

  const { data: existing } = await adminClient
    .from('cells')
    .select('x, y')
    .or(orFilter);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Cells already purchased' }, { status: 409 });
  }

  const { error } = await adminClient
    .from('cells')
    .insert({ x, y, width, height, owner_email: ownerEmail, owner_name: ownerName });

  if (error) {
    // Duplicate insert (e.g. user refreshed) — treat as success
    if (error.code === '23505') {
      return NextResponse.json({ x, y, width, height });
    }
    return NextResponse.json({ error: 'Purchase could not be saved' }, { status: 500 });
  }

  return NextResponse.json({ x, y, width, height });
}
