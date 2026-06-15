'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else onClose();
    } else {
      const { data: existing } = await supabase
        .from('usernames')
        .select('name')
        .eq('name', name.trim())
        .maybeSingle();

      if (existing) {
        setMessage('This name is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      });

      if (error) {
        setMessage(error.message);
      } else {
        await supabase.from('usernames').insert({ name: name.trim() });
        onClose();
      }
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-60"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-80 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-zinc-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-6">Million Dollar Grid</h2>

        <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'login' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setTab('login')}
          >
            Log in
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'register' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'register' && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
          />
          {message && (
            <p className="text-sm text-amber-400">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

      </div>
    </div>
  );
}
