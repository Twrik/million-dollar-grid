'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface RecentCell {
  x: number;
  y: number;
  width: number;
  height: number;
  owner_name: string | null;
  image_url: string | null;
  created_at: string;
}

interface RecentPurchasesProps {
  onNavigate: (x: number, y: number) => void;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentPurchases({ onNavigate }: RecentPurchasesProps) {
  const [cells, setCells] = useState<RecentCell[]>([]);

  useEffect(() => {
    supabase
      .from('cells')
      .select('x, y, width, height, owner_name, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setCells(data as RecentCell[]);
      });

    const channel = supabase
      .channel('recent-purchases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cells' }, (payload) => {
        setCells((prev) => [payload.new as RecentCell, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (cells.length === 0) return null;

  return (
    <div className="absolute top-24 sm:top-20 left-4 flex flex-col gap-1 pointer-events-none">
      {cells.map((c, i) => (
        <button
          key={`${c.x},${c.y}-${c.created_at}`}
          onClick={() => onNavigate(c.x, c.y)}
          className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded-lg text-left transition-all hover:bg-zinc-800/60"
          style={{ opacity: 1 - i * 0.2 }}
        >
          <div className="w-4 h-4 rounded overflow-hidden shrink-0 bg-zinc-700">
            {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <p className="text-zinc-500 text-xs truncate max-w-36">
            <span className="text-amber-400/80">{c.owner_name ?? 'Someone'}</span>
            {' · '}{timeAgo(c.created_at)}
          </p>
        </button>
      ))}
    </div>
  );
}
