'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Comment {
  id: string;
  user_name: string;
  text: string;
  created_at: string;
  likes: number;
  dislikes: number;
}

interface ImageModalProps {
  imageUrl: string;
  cell: { x: number; y: number };
  onClose: () => void;
  user: User | null;
  onLoginRequest: () => void;
}

export default function ImageModal({ imageUrl, cell, onClose, user, onLoginRequest }: ImageModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentVotes, setCommentVotes] = useState<Map<string, 'like' | 'dislike'>>(new Map());

  useEffect(() => {
    supabase
      .from('comments')
      .select('id, user_name, text, created_at, likes, dislikes')
      .eq('cell_x', cell.x)
      .eq('cell_y', cell.y)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setComments(data); });
  }, [cell.x, cell.y]);

  async function handleCommentVote(commentId: string, type: 'like' | 'dislike') {
    if (!user) { onLoginRequest(); return; }
    const existing = commentVotes.get(commentId);
    if (existing === type) return;
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const updates: { likes?: number; dislikes?: number } = {};
    if (type === 'like') updates.likes = comment.likes + 1;
    if (type === 'dislike') updates.dislikes = comment.dislikes + 1;
    if (existing === 'like') updates.likes = comment.likes - 1;
    if (existing === 'dislike') updates.dislikes = comment.dislikes - 1;
    setCommentVotes((prev) => new Map(prev).set(commentId, type));
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, ...updates } : c));
    await supabase.from('comments').update(updates).eq('id', commentId);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);

    const userName = user?.user_metadata?.name ?? user?.email ?? 'Anonym';
    const { data, error } = await supabase.from('comments').insert({
      cell_x: cell.x,
      cell_y: cell.y,
      user_name: userName,
      text: newComment.trim(),
    }).select().single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    }
    setPosting(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '90vw', maxWidth: '600px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-lg z-10"
          onClick={onClose}
        >
          ×
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={`Kästchen ${cell.x + 1} / ${cell.y + 1}`}
          className="w-full object-contain max-h-[50vh]"
        />

        <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
          <p className="text-zinc-400 text-sm">Cell {cell.x + 1} / {cell.y + 1}</p>

          {/* Comments */}
          <div className="flex flex-col gap-2">
            {comments.length === 0 && (
              <p className="text-zinc-600 text-sm">No comments yet.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="bg-zinc-800 rounded-xl px-4 py-3">
                <span className="text-amber-400 text-sm font-medium">{c.user_name}</span>
                <p className="text-white text-sm mt-1">{c.text}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleCommentVote(c.id, 'like')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                      commentVotes.get(c.id) === 'like'
                        ? 'border-green-500 bg-green-500/15 text-green-400'
                        : 'border-zinc-600 text-zinc-500 hover:border-green-500/50 hover:text-green-400'
                    }`}
                  >
                    👍 <span>{c.likes > 0 ? c.likes : 0}</span>
                  </button>
                  <button
                    onClick={() => handleCommentVote(c.id, 'dislike')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                      commentVotes.get(c.id) === 'dislike'
                        ? 'border-red-500 bg-red-500/15 text-red-400'
                        : 'border-zinc-600 text-zinc-500 hover:border-red-500/50 hover:text-red-400'
                    }`}
                  >
                    👎 <span>{c.dislikes > 0 ? c.dislikes : 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          {user ? (
            <form onSubmit={handleComment} className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Write a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                Post
              </button>
            </form>
          ) : (
            <button
              className="text-sm text-zinc-400 hover:text-amber-400 transition-colors text-left mt-1"
              onClick={onLoginRequest}
            >
              Log in to comment →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
