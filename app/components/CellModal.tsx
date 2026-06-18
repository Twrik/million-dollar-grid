'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface CellModalProps {
  cell: { x: number; y: number } | null;
  onClose: () => void;
  purchasedCells: Set<string>;
  onBlockPreview: (block: { x: number; y: number; width: number; height: number } | null) => void;
  selectedSize: { w: number; h: number };
  user: User | null;
  onImageUploaded?: (x: number, y: number, url: string) => void;
}

export default function CellModal({ cell, onClose, purchasedCells, onBlockPreview, selectedSize, user, onImageUploaded }: CellModalProps) {
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);

  const bx = cell ? Math.max(0, cell.x - selectedSize.w + 1) : 0;
  const by = cell ? Math.max(0, cell.y - selectedSize.h + 1) : 0;

  const isCellPurchased = cell ? purchasedCells.has(`${cell.x},${cell.y}`) : false;

  useEffect(() => {
    if (!cell) { onBlockPreview(null); return; }
    const tx = Math.max(0, cell.x - selectedSize.w + 1);
    const ty = Math.max(0, cell.y - selectedSize.h + 1);
    onBlockPreview({ x: tx, y: ty, width: selectedSize.w, height: selectedSize.h });
  }, [cell, selectedSize.w, selectedSize.h]);

  useEffect(() => {
    setIsOwner(false);
    setUploaded(null);
    setLink('');
    setLinkSaved(false);
    if (!cell || !isCellPurchased || !user) return;
    supabase
      .from('cells')
      .select('owner_email')
      .eq('x', cell.x)
      .eq('y', cell.y)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.owner_email && user.email && data.owner_email === user.email) {
          setIsOwner(true);
        }
      });
  }, [cell?.x, cell?.y, isCellPurchased, user?.id]);

  if (!cell) return null;

  function blockHasConflict() {
    for (let dx = 0; dx < selectedSize.w; dx++) {
      for (let dy = 0; dy < selectedSize.h; dy++) {
        if (purchasedCells.has(`${bx + dx},${by + dy}`)) return true;
      }
    }
    return false;
  }

  const conflict = blockHasConflict();
  const price = selectedSize.w * selectedSize.h;

  async function handleBuy() {
    if (!cell) return;
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: bx, y: by, width: selectedSize.w, height: selectedSize.h }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!link.trim() || !cell) return;
    let url = link.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    await fetch('/api/save-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: cell.x, y: cell.y, url }),
    });
    setLinkSaved(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !cell) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('x', String(cell.x));
    formData.append('y', String(cell.y));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      alert('Upload failed: ' + data.error);
      setUploading(false);
      return;
    }

    setUploaded(data.url);
    onImageUploaded?.(cell.x, cell.y, data.url);
    setUploading(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={() => { onClose(); onBlockPreview(null); }}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-80 max-w-[calc(100vw-2rem)] mx-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Owner with deleted image — show re-upload UI */}
        {isCellPurchased && isOwner ? (
          <>
            <h2 className="text-xl font-bold mb-1">Your cell</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Cell {cell.x + 1} / {cell.y + 1} — upload a new image
            </p>

            {/* Image upload */}
            {uploaded ? (
              <div className="text-center mb-5">
                <img src={uploaded} alt="Uploaded" className="w-28 h-28 object-cover rounded-xl mx-auto mb-2" />
                <p className="text-green-400 text-sm">Image saved!</p>
              </div>
            ) : (
              <label className="block cursor-pointer mb-5">
                <div className="border-2 border-dashed border-zinc-600 hover:border-amber-500 rounded-xl p-7 transition-colors text-center">
                  {uploading ? (
                    <p className="text-zinc-400 text-sm">Uploading…</p>
                  ) : (
                    <>
                      <p className="text-3xl mb-2">🖼️</p>
                      <p className="text-zinc-300 font-medium text-sm">Choose image</p>
                      <p className="text-zinc-500 text-xs mt-1">JPG, PNG, GIF</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            )}

            {/* Link */}
            <div className="mb-5">
              <p className="text-zinc-400 text-xs mb-2">Link (optional)</p>
              {linkSaved ? (
                <p className="text-green-400 text-sm">Link saved!</p>
              ) : (
                <form onSubmit={handleSaveLink} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://your-website.com"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!link.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold px-3 py-2 rounded-xl transition-colors text-sm"
                  >
                    Save
                  </button>
                </form>
              )}
            </div>

            <button
              className="w-full text-zinc-500 hover:text-white text-sm py-2 transition-colors"
              onClick={() => { onClose(); onBlockPreview(null); }}
            >
              {uploaded || linkSaved ? 'Done' : 'Cancel'}
            </button>
          </>
        ) : (
          /* Normal buy / already purchased flow */
          <>
            <h2 className="text-xl font-bold mb-1">Buy Cell</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Position: Column {cell.x + 1} · Row {cell.y + 1}
            </p>

            <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-sm text-zinc-300">
              <div className="flex justify-between mb-2">
                <span>Size</span>
                <span className="font-mono text-white">{selectedSize.w}×{selectedSize.h}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Cells</span>
                <span className="font-mono text-white">{price}</span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span className="font-mono text-amber-400">€{(price * 1.24).toFixed(2)}</span>
              </div>
            </div>

            {isCellPurchased ? (
              <div className="w-full bg-zinc-700 text-zinc-400 font-bold py-3 rounded-xl text-center mb-3">
                Already purchased
              </div>
            ) : conflict ? (
              <div className="w-full bg-zinc-700 text-zinc-400 font-bold py-3 rounded-xl text-center mb-3 text-sm">
                Block contains already purchased cells
              </div>
            ) : (
              <button
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-600 disabled:text-zinc-400 text-black font-bold py-3 rounded-xl transition-colors mb-3"
                onClick={handleBuy}
                disabled={loading}
              >
                {loading ? 'Redirecting…' : `Buy ${price} cell${price > 1 ? 's' : ''}`}
              </button>
            )}

            <button
              className="w-full text-zinc-500 hover:text-white text-sm py-2 transition-colors"
              onClick={() => { onClose(); onBlockPreview(null); }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
