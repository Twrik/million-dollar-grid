'use client';

import { useState, useEffect, useCallback } from 'react';

interface FreeModeProps {
  purchasedCells: Set<string>;
  onClose: () => void;
  onNavigate: (x: number, y: number) => void;
}

function randomFreeCell(purchasedCells: Set<string>): { x: number; y: number } {
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * 1000);
    y = Math.floor(Math.random() * 1000);
  } while (purchasedCells.has(`${x},${y}`));
  return { x, y };
}

export default function FreeMode({ purchasedCells, onClose, onNavigate }: FreeModeProps) {
  const [cell, setCell] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = randomFreeCell(purchasedCells);
    setCell(c);
    onNavigate(c.x, c.y);
  }, [purchasedCells]);

  const next = useCallback(() => {
    const c = randomFreeCell(purchasedCells);
    setCell(c);
    onNavigate(c.x, c.y);
  }, [purchasedCells, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, onClose]);

  async function handleBuy() {
    if (!cell) return;
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: cell.x, y: cell.y }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl z-10"
        onClick={onClose}
      >
        ✕
      </button>

      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-80 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Freies Kästchen</p>

        {cell && (
          <>
            <div className="bg-zinc-800 rounded-xl p-5 mb-6 text-center">
              <p className="text-4xl font-bold text-white mb-1">{cell.x + 1}</p>
              <p className="text-zinc-500 text-sm">Spalte</p>
              <div className="my-3 border-t border-zinc-700" />
              <p className="text-4xl font-bold text-white mb-1">{cell.y + 1}</p>
              <p className="text-zinc-500 text-sm">Zeile</p>
            </div>

            <div className="flex justify-between text-sm text-zinc-400 mb-6">
              <span>Preis</span>
              <span className="text-amber-400 font-mono font-bold">1,00 €</span>
            </div>

            <button
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl transition-colors mb-3"
              onClick={handleBuy}
              disabled={loading}
            >
              {loading ? 'Weiterleitung…' : 'Dieses Kästchen kaufen'}
            </button>

            <button
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors"
              onClick={next}
            >
              Nächstes →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
