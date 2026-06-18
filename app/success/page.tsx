'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

function SuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);
  const [cell, setCell] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const savedRef = useRef(false);

  const sessionId = params.get('session_id');

  useEffect(() => {
    if (savedRef.current) return;
    if (!sessionId) { setStatus('error'); return; }
    savedRef.current = true;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const ownerName = user?.user_metadata?.name ?? user?.email ?? null;
      const ownerEmail = user?.email ?? null;
      return fetch('/api/confirm-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ownerName, ownerEmail }),
      });
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // 409 = already inserted (page refresh) — treat as success
          if (data.error === 'Cells already purchased') {
            setStatus('done');
          } else {
            setStatus('error');
          }
        } else {
          setCell({ x: data.x, y: data.y, width: data.width, height: data.height });
          setStatus('done');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!link.trim() || !cell) return;
    let url = link.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    await fetch('/api/save-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: cell.x, y: cell.y, url, sessionId }),
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
    if (sessionId) formData.append('session_id', sessionId);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      alert('Upload fehlgeschlagen: ' + data.error);
      setUploading(false);
      return;
    }

    setImageUrl(data.url);
    setUploading(false);
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-md w-full">
        {status === 'loading' && <p className="text-zinc-400">Confirming payment…</p>}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Something went wrong</h1>
            <a href="/" className="text-zinc-400 hover:text-white underline">Back to homepage</a>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">Payment successful!</h1>
            {cell && <p className="text-zinc-400 mb-6">Cell {cell.x + 1} / {cell.y + 1} is yours.</p>}

            {cell && (
              <>
                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
                  <h2 className="text-lg font-bold mb-3">Upload image</h2>
                  <p className="text-zinc-400 text-sm mb-4">Upload an image to display on your cell.</p>

                  {imageUrl ? (
                    <div>
                      <img src={imageUrl} alt="Uploaded" className="w-32 h-32 object-cover rounded-lg mx-auto mb-3" />
                      <p className="text-green-400 text-sm">Image saved!</p>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-zinc-600 hover:border-amber-500 rounded-xl p-8 transition-colors">
                        {uploading ? (
                          <p className="text-zinc-400">Uploading…</p>
                        ) : (
                          <>
                            <p className="text-zinc-300 font-medium">Choose image</p>
                            <p className="text-zinc-500 text-sm mt-1">JPG, PNG, GIF — max. 2 MB</p>
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
                </div>

                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
                  <h2 className="text-lg font-bold mb-3">Add a link</h2>
                  <p className="text-zinc-400 text-sm mb-4">Optional link shown on your cell (e.g. your website).</p>
                  {linkSaved ? (
                    <p className="text-green-400 text-sm">Link saved!</p>
                  ) : (
                    <form onSubmit={handleSaveLink} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://your-website.com"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!link.trim()}
                        className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold px-4 py-2 rounded-xl transition-colors text-sm"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}

            <a href="/" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors inline-block">
              Back to the Grid
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <SuccessContent />
    </Suspense>
  );
}
