import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { rateLimit } from '../../lib/ratelimit';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function detectImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'gif';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';
  return null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const cellX = parseInt(formData.get('x') as string, 10);
  const cellY = parseInt(formData.get('y') as string, 10);
  const sessionId = formData.get('session_id') as string | null;

  if (!file || isNaN(cellX) || isNaN(cellY)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 2 MB)' }, { status: 413 });
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const ext = detectImageType(bytes);
  if (!ext) {
    return NextResponse.json({ error: 'Ungültiger Dateityp. Nur JPG, PNG, GIF und WebP erlaubt.' }, { status: 415 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Eigentümerschaft prüfen: entweder via Stripe-Session (Gast-Kauf) oder Login
  if (sessionId) {
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

    if (cellX < sx || cellX >= sx + sw || cellY < sy || cellY >= sy + sh) {
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
      .eq('x', cellX)
      .eq('y', cellY)
      .maybeSingle();

    if (!cell || cell.owner_email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const path = `${cellX}-${cellY}-${Date.now()}.${ext}`;
  const mimeTypes: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

  const { error: uploadError } = await adminClient.storage
    .from('cell-images')
    .upload(path, buffer, { contentType: mimeTypes[ext], upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }

  const { data: { publicUrl } } = adminClient.storage.from('cell-images').getPublicUrl(path);
  await adminClient.from('cells').update({ image_url: publicUrl }).eq('x', cellX).eq('y', cellY);

  return NextResponse.json({ url: publicUrl });
}
