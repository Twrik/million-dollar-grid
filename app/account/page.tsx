'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export default function AccountPage() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) setNewName(data.user.user_metadata?.name ?? '');
    });
  }, []);

  async function handleChangeName(e: React.FormEvent) {
    e.preventDefault();
    if (!user || user === 'loading') return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavingName(true);
    setNameMsg('');

    const currentName = (user as User).user_metadata?.name;

    if (trimmed !== currentName) {
      const { data: existing } = await supabase
        .from('usernames')
        .select('name')
        .eq('name', trimmed)
        .maybeSingle();

      if (existing) {
        setNameMsg('This name is already taken.');
        setSavingName(false);
        return;
      }

      if (currentName) {
        await supabase.from('usernames').delete().eq('name', currentName);
      }
      await supabase.from('usernames').insert({ name: trimmed });
    }

    const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });
    if (error) {
      setNameMsg('Error: ' + error.message);
    } else {
      setNameMsg('Name updated!');
      setUser((prev) => prev && prev !== 'loading'
        ? { ...prev, user_metadata: { ...prev.user_metadata, name: trimmed } }
        : prev
      );
    }
    setSavingName(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setPwMsg('Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    setPwMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg('Error: ' + error.message);
    } else {
      setPwMsg('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPw(false);
  }

if (user === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500 text-sm">You are not logged in. <a href="/" className="text-amber-400 hover:text-amber-300">← Back</a></p>
      </div>
    );
  }

  const u = user as User;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 py-14">
        <a href="/" className="text-zinc-500 hover:text-white text-sm transition-colors mb-10 inline-block">← Back to Grid</a>

        <h1 className="text-2xl font-bold mb-1">Account Settings</h1>
        <p className="text-zinc-500 text-sm mb-10">{u.email}</p>

        {/* Change name */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="text-base font-semibold mb-4">Display name</h2>
          <form onSubmit={handleChangeName} className="flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Your display name"
              className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder-zinc-600 transition-colors"
            />
            {nameMsg && (
              <p className={`text-xs ${nameMsg.includes('Error') || nameMsg.includes('taken') ? 'text-red-400' : 'text-green-400'}`}>
                {nameMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={savingName || !newName.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </section>

        {/* Change password */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="text-base font-semibold mb-4">Change password</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder-zinc-600 transition-colors"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder-zinc-600 transition-colors"
            />
            {pwMsg && (
              <p className={`text-xs ${pwMsg.includes('Error') || pwMsg.includes('not match') || pwMsg.includes('least') ? 'text-red-400' : 'text-green-400'}`}>
                {pwMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={savingPw || !newPassword || !confirmPassword}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {savingPw ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </section>

        {/* Sign out */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="text-base font-semibold mb-1">Sign out</h2>
          <p className="text-zinc-500 text-sm mb-4">You will be logged out of your account.</p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors"
          >
            Sign out
          </button>
        </section>

        {/* Delete account */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-1">Delete account</h2>
          <p className="text-zinc-500 text-sm mb-4">
            To delete your account, send us an email and we'll take care of it manually.
          </p>
          <a
            href="mailto:m.dollargrid@proton.me?subject=Account deletion request"
            className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            m.dollargrid@proton.me
          </a>
        </section>
      </div>
    </main>
  );
}
