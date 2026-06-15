'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ReportModal from './ReportModal';

interface Cell {
  x: number;
  y: number;
  image_url: string;
  likes: number;
  link_url: string | null;
  owner_name: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  user_name: string;
  text: string;
  created_at: string;
  likes: number;
  dislikes: number;
}

interface RandomModeProps {
  onClose: () => void;
  user: User | null;
  onLoginRequest: () => void;
  startAt?: { x: number; y: number };
  cleanMode?: boolean;
}

function ExternalLinkWarning({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-70" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-3xl mb-3 text-center">⚠️</div>
        <h2 className="text-white font-bold text-lg text-center mb-2">External Website</h2>
        <p className="text-zinc-400 text-sm text-center mb-1">You are leaving Million Dollar Grid.</p>
        <p className="text-zinc-500 text-xs text-center mb-4">
          This link was added by a user and has not been reviewed by us. Million Dollar Grid takes no responsibility for external content. Visit at your own risk.
        </p>
        <p className="text-zinc-600 text-xs text-center mb-5 break-all">{url}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold py-2.5 rounded-xl transition-colors text-center"
          >
            Open anyway
          </a>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all text-sm ${
        copied ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400'
      }`}
      title="Link kopieren"
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

export default function RandomMode({ onClose, user, onLoginRequest, startAt, cleanMode }: RandomModeProps) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [index, setIndex] = useState(0);
  const [purchaseRank, setPurchaseRank] = useState<Map<string, number>>(new Map());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!user) { setLiked(new Set()); return; }
    try {
      const stored = localStorage.getItem(`mdg_liked_${user.id}`);
      setLiked(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setLiked(new Set()); }
  }, [user?.id]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentVotes, setCommentVotes] = useState<Map<string, 'like' | 'dislike'>>(new Map());
  const [warnUrl, setWarnUrl] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set());

  const isRandom = !startAt;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('cells')
        .select('x, y, image_url, likes, link_url, owner_name, created_at')
        .not('image_url', 'is', null);
      if (data && data.length > 0) {
        // Build purchase rank from created_at order
        const byPurchase = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const rankMap = new Map<string, number>();
        byPurchase.forEach((c, i) => rankMap.set(`${c.x},${c.y}`, i + 1));
        setPurchaseRank(rankMap);

        // Sort spatially for navigation (row by row, left to right)
        const ordered = (data as Cell[]).sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
        setCells(ordered);
        if (startAt) {
          const idx = ordered.findIndex((c) => c.x === startAt.x && c.y === startAt.y);
          setIndex(idx !== -1 ? idx : 0);
        } else {
          setIndex(Math.floor(Math.random() * ordered.length));
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const current = cells[index];

  useEffect(() => {
    setShowComments(false);
    setComments([]);
    setNewComment('');
    setCommentVotes(new Map());
  }, [index]);

  function getCvotesKey() {
    return user ? `mdg_cvotes_${user.id}` : null;
  }

  function loadStoredVotes(): Record<string, 'like' | 'dislike'> {
    const key = getCvotesKey();
    if (!key) return {};
    try {
      return JSON.parse(localStorage.getItem(key) ?? '{}');
    } catch { return {}; }
  }

  function saveStoredVote(commentId: string, type: 'like' | 'dislike') {
    const key = getCvotesKey();
    if (!key) return;
    try {
      const stored = loadStoredVotes();
      stored[commentId] = type;
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
  }

  async function loadComments() {
    if (!current) return;
    const { data } = await supabase
      .from('comments')
      .select('id, user_name, text, created_at, likes, dislikes')
      .eq('cell_x', current.x)
      .eq('cell_y', current.y)
      .order('created_at', { ascending: true });
    if (data) {
      setComments(data);
      const stored = loadStoredVotes();
      const map = new Map<string, 'like' | 'dislike'>();
      data.forEach((c) => { if (stored[c.id]) map.set(c.id, stored[c.id]); });
      setCommentVotes(map);
    }
  }

  async function handleCommentVote(commentId: string, type: 'like' | 'dislike') {
    if (!user) { onLoginRequest(); return; }
    const existing = commentVotes.get(commentId);
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const toggling = existing === type;
    const updates: { likes?: number; dislikes?: number } = {};

    if (toggling) {
      // Nochmal drücken → Like/Dislike entfernen
      if (type === 'like') updates.likes = Math.max(0, comment.likes - 1);
      if (type === 'dislike') updates.dislikes = Math.max(0, comment.dislikes - 1);
      setCommentVotes((prev) => { const next = new Map(prev); next.delete(commentId); return next; });
    } else {
      // Neue Stimme — ggf. alte entfernen
      if (type === 'like') updates.likes = comment.likes + 1;
      if (type === 'dislike') updates.dislikes = comment.dislikes + 1;
      if (existing === 'like') updates.likes = (updates.likes ?? comment.likes) - 1;
      if (existing === 'dislike') updates.dislikes = (updates.dislikes ?? comment.dislikes) - 1;
      setCommentVotes((prev) => new Map(prev).set(commentId, type));
      saveStoredVote(commentId, type);
    }

    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, ...updates } : c));
    await fetch('/api/vote-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentId,
        likeDelta: updates.likes !== undefined ? updates.likes - comment.likes : 0,
        dislikeDelta: updates.dislikes !== undefined ? updates.dislikes - comment.dislikes : 0,
      }),
    });
  }

  async function handleReportComment(c: Comment) {
    if (!user) { onLoginRequest(); return; }
    if (reportedComments.has(c.id)) return;
    await supabase.from('reports').insert({
      cell_x: current?.x ?? 0,
      cell_y: current?.y ?? 0,
      reason: `[Comment:${c.id}] by ${c.user_name}: "${c.text.slice(0, 200)}"`,
    });
    setReportedComments((prev) => new Set(prev).add(c.id));
  }

  function toggleComments() {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  }

  const goNext = useCallback(() => {
    if (isRandom) {
      setIndex((i) => {
        if (cells.length <= 1) return i;
        let next;
        do { next = Math.floor(Math.random() * cells.length); } while (next === i);
        return next;
      });
    } else {
      setIndex((i) => (i + 1) % cells.length);
    }
  }, [cells.length, isRandom]);

  const goPrev = useCallback(() => {
    if (isRandom) {
      setIndex((i) => {
        if (cells.length <= 1) return i;
        let next;
        do { next = Math.floor(Math.random() * cells.length); } while (next === i);
        return next;
      });
    } else {
      setIndex((i) => (i - 1 + cells.length) % cells.length);
    }
  }, [cells.length, isRandom]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  async function handleLike() {
    if (!current) return;
    if (!user) { onLoginRequest(); return; }
    const key = `${current.x},${current.y}`;
    const isAlreadyLiked = liked.has(key);
    const newLikes = isAlreadyLiked ? current.likes - 1 : current.likes + 1;
    setLiked((prev) => {
      const next = new Set(prev);
      isAlreadyLiked ? next.delete(key) : next.add(key);
      try { localStorage.setItem(`mdg_liked_${user.id}`, JSON.stringify([...next])); } catch {}
      return next;
    });
    setCells((prev) =>
      prev.map((c) =>
        c.x === current.x && c.y === current.y ? { ...c, likes: newLikes } : c
      )
    );
    await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: current.x, y: current.y, action: isAlreadyLiked ? 'unlike' : 'like' }),
    });
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !current) return;
    setPosting(true);
    const userName = user?.user_metadata?.name ?? user?.email ?? 'Anonym';
    const { data, error } = await supabase.from('comments').insert({
      cell_x: current.x,
      cell_y: current.y,
      user_name: userName,
      text: newComment.trim(),
    }).select().single();
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    }
    setPosting(false);
  }

  const isLiked = current ? liked.has(`${current.x},${current.y}`) : false;

  const rank = current ? purchaseRank.get(`${current.x},${current.y}`) : undefined;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 20%, rgba(201,168,76,0.06) 0%, #07070D 55%)' }}
      onClick={onClose}
    >
      {/* Close button — top right of modal */}
      {!cleanMode && <button
        className="absolute top-3 right-3 z-30 flex items-center justify-center rounded-full"
        style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}
        onClick={onClose}
      >
        ✕
      </button>}

      {/* Center: arrows + image card */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-2">
        {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm)' }}>Loading…</p>}
        {!loading && cells.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm)' }}>No cells with images yet.</p>
        )}

        {current && (
          <div className="flex items-center gap-3 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Prev */}
            <button
              onClick={goPrev}
              className="shrink-0 flex items-center justify-center rounded-full transition-all"
              style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', fontSize: '20px' }}
            >‹</button>

            {/* Card */}
            <div
              className="flex-1 flex flex-col min-w-0"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
                touchStartX.current = null;
              }}
            >
              {/* Top row — above image, mirroring info bar below */}
              {!cleanMode && <div
                className="flex items-center justify-between gap-3 mb-2 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-oxanium)', fontSize: '11px', color: 'var(--gold)', fontWeight: 600 }}>#{rank ?? '—'}</span>
                  <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-oxanium)', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{cells.length} cells</span>
                </div>
                <button
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)' }}
                  onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                >
                  ⚑ Report
                </button>
              </div>}

              {/* Image */}
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 50px rgba(201,168,76,0.07), 0 20px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                <img
                  src={current.image_url}
                  alt={`Cell ${current.x + 1} / ${current.y + 1}`}
                  className="w-full object-contain"
                  style={{ maxHeight: 'calc(100vh - 260px)', display: 'block' }}
                />
              </div>

              {/* Info bar */}
              {!cleanMode && <div
                className="flex items-center gap-3 mt-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
              >
                <div className="min-w-0" style={{ flexShrink: 0 }}>
                  {current.owner_name && (
                    <p style={{ fontFamily: 'var(--font-oxanium)', fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{current.owner_name}</p>
                  )}
                  <p style={{ fontFamily: 'var(--font-dm)', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                    Cell {current.x + 1} / {current.y + 1}
                  </p>
                </div>
                {current.link_url && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
                    <CopyButton url={current.link_url} />
                    <button
                      onClick={() => setWarnUrl(current.link_url)}
                      className="flex items-center gap-1 rounded-full"
                      style={{ padding: '3px 9px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)', color: 'var(--gold)', fontSize: '11px', maxWidth: '160px' }}
                    >
                      <span className="truncate">🔗 {current.link_url.replace(/^https?:\/\//, '')}</span>
                    </button>
                  </div>
                )}
                {!current.link_url && <div className="flex-1" />}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 rounded-full transition-all"
                    style={{
                      padding: '7px 13px', fontSize: '12px', fontFamily: 'var(--font-dm)', fontWeight: 500,
                      background: showComments ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
                      border: showComments ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.09)',
                      color: showComments ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    💬 {comments.length > 0 ? comments.length : ''}
                  </button>
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 rounded-full transition-all"
                    style={{
                      padding: '7px 13px', fontSize: '12px', fontFamily: 'var(--font-dm)', fontWeight: 500,
                      background: isLiked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                      border: isLiked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.09)',
                      color: isLiked ? '#f87171' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {isLiked ? '❤️' : '🤍'} {current.likes}
                  </button>
                </div>
              </div>}
            </div>

            {/* Next */}
            <button
              onClick={goNext}
              className="shrink-0 flex items-center justify-center rounded-full transition-all"
              style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', fontSize: '20px' }}
            >›</button>
          </div>
        )}
      </div>

      <div className="h-4 shrink-0" />

      {/* Comments sheet — slides up from bottom */}
      <div
        className="absolute bottom-0 left-1/2 z-20 flex flex-col"
        style={{
          width: 'min(672px, calc(100vw - 120px))',
          transform: showComments ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
          height: '40%',
          background: 'rgba(9,9,16,0.97)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          borderLeft: '1px solid rgba(255,255,255,0.09)',
          borderRight: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px 20px 0 0',
          transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily: 'var(--font-oxanium)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            Comments {comments.length > 0 && <span style={{ color: 'var(--gold)' }}>{comments.length}</span>}
          </span>
          <button onClick={() => setShowComments(false)} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-4 min-h-0">
          {comments.length === 0 && (
            <p style={{ fontFamily: 'var(--font-dm)', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c.id}>
              <span style={{ fontFamily: 'var(--font-oxanium)', fontSize: '12px', fontWeight: 700, color: 'var(--gold)' }}>{c.user_name}</span>
              <p style={{ fontFamily: 'var(--font-dm)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginTop: '2px' }} className="break-all">{c.text}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleCommentVote(c.id, 'like')}
                  className="flex items-center gap-1 rounded-full border text-xs transition-all"
                  style={{ padding: '3px 9px', background: commentVotes.get(c.id) === 'like' ? 'rgba(34,197,94,0.12)' : 'transparent', borderColor: commentVotes.get(c.id) === 'like' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)', color: commentVotes.get(c.id) === 'like' ? '#4ade80' : 'rgba(255,255,255,0.3)' }}
                >👍 {c.likes > 0 ? c.likes : 0}</button>
                <button
                  onClick={() => handleCommentVote(c.id, 'dislike')}
                  className="flex items-center gap-1 rounded-full border text-xs transition-all"
                  style={{ padding: '3px 9px', background: commentVotes.get(c.id) === 'dislike' ? 'rgba(239,68,68,0.12)' : 'transparent', borderColor: commentVotes.get(c.id) === 'dislike' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)', color: commentVotes.get(c.id) === 'dislike' ? '#f87171' : 'rgba(255,255,255,0.3)' }}
                >👎 {c.dislikes > 0 ? c.dislikes : 0}</button>
                {user && c.user_name === (user.user_metadata?.name ?? user.email) ? (
                  <button
                    onClick={async () => {
                      await fetch('/api/delete-comment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ commentId: c.id }),
                      });
                      setComments((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                    className="ml-auto text-xs"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                  >🗑️</button>
                ) : (
                  <button
                    onClick={() => handleReportComment(c)}
                    className="ml-auto text-xs"
                    style={{ color: reportedComments.has(c.id) ? '#f87171' : 'rgba(255,255,255,0.15)' }}
                  >{reportedComments.has(c.id) ? '⚑ Reported' : '⚑'}</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {user ? (
            <form onSubmit={handleComment} className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Add a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-full outline-none"
                style={{ fontFamily: 'var(--font-dm)', fontSize: '13px', color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 14px' }}
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                style={{ fontFamily: 'var(--font-dm)', fontSize: '13px', fontWeight: 700, color: posting || !newComment.trim() ? 'rgba(255,255,255,0.2)' : 'var(--gold)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
              >Post</button>
            </form>
          ) : (
            <button onClick={onLoginRequest} style={{ fontFamily: 'var(--font-dm)', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              Log in to comment →
            </button>
          )}
        </div>
      </div>
    </div>
    {warnUrl && <ExternalLinkWarning url={warnUrl} onClose={() => setWarnUrl(null)} />}
    {showReport && current && <ReportModal cell={current} onClose={() => setShowReport(false)} />}
    </>
  );
}
