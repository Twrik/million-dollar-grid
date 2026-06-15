import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit } from '../../lib/ratelimit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const GRID_SIZE = 1000;
const MAX_BLOCK = 50;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' }, { status: 429 });
  }

  const body = await req.json();
  const x = parseInt(body.x, 10);
  const y = parseInt(body.y, 10);
  const width = parseInt(body.width ?? 1, 10);
  const height = parseInt(body.height ?? 1, 10);

  if (
    isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) ||
    x < 0 || y < 0 || width < 1 || height < 1 ||
    x >= GRID_SIZE || y >= GRID_SIZE ||
    width > MAX_BLOCK || height > MAX_BLOCK ||
    x + width > GRID_SIZE || y + height > GRID_SIZE
  ) {
    return NextResponse.json({ error: 'Invalid cell parameters' }, { status: 400 });
  }

  const count = width * height;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: count === 1
              ? `Kästchen ${x + 1} / ${y + 1}`
              : `Block ${width}×${height} ab Kästchen ${x + 1} / ${y + 1}`,
            description: 'Million Dollar Grid — dauerhafter Werbeplatz',
          },
          unit_amount: count * 124,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: { x: String(x), y: String(y), width: String(width), height: String(height) },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
  });

  return NextResponse.json({ url: session.url });
}
