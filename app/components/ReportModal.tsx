'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ReportModalProps {
  cell: { x: number; y: number };
  onClose: () => void;
}

export default function ReportModal({ cell, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSending(true);
    await supabase.from('reports').insert({
      cell_x: cell.x,
      cell_y: cell.y,
      reason,
    });
    setDone(true);
    setSending(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-70"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-white font-bold text-lg mb-2">Report received</h2>
            <p className="text-zinc-400 text-sm mb-5">Thank you for your report. We will review the content as soon as possible.</p>
            <button
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Report content</h2>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-zinc-500 text-xs mb-4">Cell {cell.x + 1} / {cell.y + 1}</p>

            <form onSubmit={handleSubmit}>
              <p className="text-zinc-400 text-sm mb-3">Reason for report:</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe why you are reporting this content…"
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-zinc-600 transition-colors resize-none mb-5"
              />
              <button
                type="submit"
                disabled={!reason || sending}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                {sending ? 'Sending…' : 'Submit report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
