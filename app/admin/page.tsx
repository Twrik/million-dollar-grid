'use client';

import { useState, useEffect } from 'react';

interface Report {
  id: string;
  cell_x: number;
  cell_y: number;
  reason: string;
  created_at: string;
  image_url?: string | null;
  owner_name?: string | null;
}

type Tab = 'reports' | 'comments';

function parseCommentReport(r: Report): { commentId: string; userName: string; text: string } | null {
  const match = r.reason.match(/^\[Comment:([^\]]+)\] by (.+?): "(.*)"$/s);
  if (!match) return null;
  return { commentId: match[1], userName: match[2], text: match[3] };
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | 'loading'>('loading');
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/reports')
      .then((res) => {
        if (res.status === 403) { setAuthorized(false); return null; }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setReports(data);
        setAuthorized(true);
      })
      .catch(() => setAuthorized(false));
  }, []);

  async function handleDeleteImage(report: Report) {
    setActionId(report.id);
    await fetch('/api/admin/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id, cell_x: report.cell_x, cell_y: report.cell_y }),
    });
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setActionId(null);
  }

  async function handleDismiss(id: string) {
    setActionId(id);
    await fetch('/api/admin/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: id }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
    setActionId(null);
  }

  async function handleDeleteComment(reportId: string, commentId: string) {
    setActionId(reportId);
    await fetch('/api/admin/delete-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, commentId }),
    });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setActionId(null);
  }

  if (authorized === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-sm">404 — Not found</p>
      </div>
    );
  }

  const imageReports = reports.filter((r) => !r.reason.startsWith('[Comment:'));
  const commentReports = reports.filter((r) => r.reason.startsWith('[Comment:'));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-zinc-500 text-sm mt-1">Million Dollar Grid</p>
          </div>
          <a href="/" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">← Back to Grid</a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs mb-1">Image reports</p>
            <p className="text-white text-2xl font-bold">{imageReports.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs mb-1">Reported comments</p>
            <p className="text-white text-2xl font-bold">{commentReports.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            onClick={() => setTab('reports')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === 'reports' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ⚑ Reports {imageReports.length > 0 && <span className="ml-1.5 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{imageReports.length}</span>}
          </button>
          <button
            onClick={() => setTab('comments')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === 'comments' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            💬 Reported Comments {commentReports.length > 0 && <span className="ml-1.5 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{commentReports.length}</span>}
          </button>
        </div>

        {/* Reports tab */}
        {tab === 'reports' && (
          <>
            {imageReports.length === 0 && (
              <div className="text-center mt-12">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-zinc-400">No open reports.</p>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {imageReports.map((r) => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-5">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs text-center px-2">No image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">
                          Cell {r.cell_x + 1} / {r.cell_y + 1}
                          {r.owner_name && <span className="text-amber-400 font-normal ml-2 text-sm">— {r.owner_name}</span>}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">{new Date(r.created_at).toLocaleString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-800 rounded-xl px-4 py-3 mt-3">
                      <p className="text-zinc-400 text-xs mb-1">Reason:</p>
                      <p className="text-white text-sm">{r.reason}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        disabled={actionId === r.id}
                        onClick={() => handleDeleteImage(r)}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        🗑️ Delete image
                      </button>
                      <button
                        disabled={actionId === r.id}
                        onClick={() => handleDismiss(r.id)}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-300 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        ✓ Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Comments tab */}
        {tab === 'comments' && (
          <>
            {commentReports.length === 0 && (
              <div className="text-center mt-12">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-zinc-400">No reported comments.</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {commentReports.map((r) => {
                const parsed = parseCommentReport(r);
                return (
                  <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {parsed ? (
                          <span className="text-amber-400 text-xs font-semibold">{parsed.userName}</span>
                        ) : (
                          <span className="text-zinc-500 text-xs">Unknown</span>
                        )}
                        <span className="text-zinc-700 text-xs">·</span>
                        <span className="text-zinc-500 text-xs">Cell {r.cell_x + 1} / {r.cell_y + 1}</span>
                        <span className="text-zinc-700 text-xs">·</span>
                        <span className="text-zinc-500 text-xs">{new Date(r.created_at).toLocaleString('en-GB')}</span>
                      </div>
                      <div className="bg-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-white text-sm wrap-break-word">
                          {parsed ? parsed.text : r.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {parsed && (
                        <button
                          disabled={actionId === r.id}
                          onClick={() => handleDeleteComment(r.id, parsed.commentId)}
                          className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      )}
                      <button
                        disabled={actionId === r.id}
                        onClick={() => handleDismiss(r.id)}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                      >
                        ✓ Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
