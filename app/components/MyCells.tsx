'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface OwnedCell {
  x: number;
  y: number;
  width: number;
  height: number;
  image_url: string | null;
  link_url: string | null;
}

interface LikedCell {
  x: number;
  y: number;
  image_url: string;
  owner_name: string | null;
  likes: number;
}

interface MyCellsProps {
  user: User;
  onClose: () => void;
  onNavigate: (x: number, y: number) => void;
}

type Tab = 'cells' | 'likes';

export default function MyCells({ user, onClose, onNavigate }: MyCellsProps) {
  const [tab, setTab] = useState<Tab>('cells');
  const [cells, setCells] = useState<OwnedCell[]>([]);
  const [likedCells, setLikedCells] = useState<LikedCell[]>([]);
  const [loadingCells, setLoadingCells] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(true);

  useEffect(() => {
    supabase
      .from('cells')
      .select('x, y, width, height, image_url, link_url')
      .eq('owner_email', user.email)
      .then(({ data }) => {
        if (data) setCells(data as OwnedCell[]);
        setLoadingCells(false);
      });
  }, [user.email]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`mdg_liked_${user.id}`);
      const keys: string[] = stored ? JSON.parse(stored) : [];
      if (keys.length === 0) { setLoadingLikes(false); return; }
      const pairs = keys.map((k) => {
        const [x, y] = k.split(',').map(Number);
        return { x, y };
      });
      Promise.all(
        pairs.map(({ x, y }) =>
          supabase
            .from('cells')
            .select('x, y, image_url, owner_name, likes')
            .eq('x', x)
            .eq('y', y)
            .maybeSingle()
        )
      ).then((results) => {
        const found: LikedCell[] = results
          .map((r) => r.data)
          .filter((d): d is LikedCell => !!d && !!d.image_url);
        setLikedCells(found);
        setLoadingLikes(false);
      });
    } catch {
      setLoadingLikes(false);
    }
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative bg-zinc-900 border-l border-zinc-700 w-80 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">My Activity</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setTab('cells')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'cells'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🗂️ My Cells
          </button>
          <button
            onClick={() => setTab('likes')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'likes'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ❤️ My Likes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'cells' && (
            <>
              {loadingCells && <p className="text-zinc-500 text-sm text-center mt-8">Loading…</p>}
              {!loadingCells && cells.length === 0 && (
                <div className="text-center mt-8">
                  <p className="text-zinc-400 text-sm">You don't own any cells yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Buy your first cell!</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {cells.map((c) => (
                  <button
                    key={`${c.x},${c.y}`}
                    onClick={() => { onNavigate(c.x, c.y); onClose(); }}
                    className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl p-3 transition-colors text-left w-full"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-700 flex items-center justify-center">
                      {c.image_url ? (
                        <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-500 text-xl">🖼️</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">Cell {c.x + 1} / {c.y + 1}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{c.width}×{c.height}</p>
                      {!c.image_url && (
                        <p className="text-amber-500 text-xs mt-0.5">No image uploaded</p>
                      )}
                      {c.link_url && (
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">
                          🔗 {c.link_url.replace(/^https?:\/\//, '')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'likes' && (
            <>
              {loadingLikes && <p className="text-zinc-500 text-sm text-center mt-8">Loading…</p>}
              {!loadingLikes && likedCells.length === 0 && (
                <div className="text-center mt-8">
                  <p className="text-zinc-400 text-sm">No liked images yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Like images to find them here!</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {likedCells.map((c) => (
                  <button
                    key={`${c.x},${c.y}`}
                    onClick={() => { onNavigate(c.x, c.y); onClose(); }}
                    className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl p-3 transition-colors text-left w-full"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-700">
                      <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">Cell {c.x + 1} / {c.y + 1}</p>
                      {c.owner_name && (
                        <p className="text-amber-400 text-xs mt-0.5">{c.owner_name}</p>
                      )}
                      <p className="text-zinc-500 text-xs mt-0.5">❤️ {c.likes}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
