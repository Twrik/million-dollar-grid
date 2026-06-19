'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TopCell {
  x: number;
  y: number;
  image_url: string;
  owner_name: string | null;
  likes: number;
}

interface LeaderboardProps {
  onClose: () => void;
  onNavigate: (x: number, y: number) => void;
}

export default function Leaderboard({ onClose, onNavigate }: LeaderboardProps) {
  const [cells, setCells] = useState<TopCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('cells')
          .select('x, y, image_url, owner_name, likes')
          .not('image_url', 'is', null)
          .order('likes', { ascending: false })
          .limit(10);
        if (error) { setError(true); setLoading(false); return; }
        if (data) setCells(data as TopCell[]);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-start" onClick={onClose}>
      <div
        className="relative bg-zinc-900 border-r border-zinc-700 w-80 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>
        <p className="text-zinc-600 text-xs px-5 py-3 border-b border-zinc-800">Top 10 most liked images</p>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-zinc-500 text-sm text-center mt-8">Loading…</p>}
          {!loading && error && (
            <p className="text-red-400 text-sm text-center mt-8">Could not load leaderboard. Check your connection.</p>
          )}
          {!loading && !error && cells.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-8">No images yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {cells.map((c, i) => (
              <button
                key={`${c.x},${c.y}`}
                onClick={() => { onNavigate(c.x, c.y); onClose(); }}
                className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl p-3 transition-colors text-left w-full"
              >
                <span className={`text-lg font-bold w-7 shrink-0 text-center ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-600'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-700">
                  <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {c.owner_name ?? `Cell ${c.x + 1}/${c.y + 1}`}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">Cell {c.x + 1} / {c.y + 1}</p>
                </div>
                <span className="text-red-400 text-sm font-semibold shrink-0">❤️ {c.likes}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
