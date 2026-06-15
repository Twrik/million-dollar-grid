import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const { x, y, url, sessionId } = await req.json();

  if (typeof x !== 'number' || typeof y !== 'number' || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // URL validieren — nur http/https erlaubt
  if (!/^https?:\/\/.+/i.test(url) || url.length > 2048) {
    return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Eigentümerschaft prüfen: Stripe-Session (Gast) oder Login
  if (sessionId && typeof sessionId === 'string') {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json({ error: 'Ungültige Session' }, { status: 400 });
    }

    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Zahlung nicht abgeschlossen' }, { status: 402 });
    }

    const sx = parseInt(stripeSession.metadata?.x ?? '', 10);
    const sy = parseInt(stripeSession.metadata?.y ?? '', 10);
    const sw = parseInt(stripeSession.metadata?.width ?? '1', 10);
    const sh = parseInt(stripeSession.metadata?.height ?? '1', 10);

    if (x < sx || x >= sx + sw || y < sy || y >= sy + sh) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    const cookieStore = await cookies();
    const userClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: cell } = await adminClient
      .from('cells')
      .select('owner_email')
      .eq('x', x)
      .eq('y', y)
      .maybeSingle();

    if (!cell || cell.owner_email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await adminClient.from('cells').update({ link_url: url }).eq('x', x).eq('y', y);
  return NextResponse.json({ ok: true });
}
