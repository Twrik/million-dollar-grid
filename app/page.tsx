'use client';

import { useState, useEffect, useRef } from 'react';
import Grid, { GridHandle, CellImageData } from './components/Grid';
import CellModal from './components/CellModal';
import RandomMode from './components/RandomMode';
import AuthModal from './components/AuthModal';
import MyCells from './components/MyCells';
import Leaderboard from './components/Leaderboard';
import RecentPurchases from './components/RecentPurchases';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const SIZES = [
  { label: '1×1', w: 1, h: 1 },
  { label: '2×2', w: 2, h: 2 },
  { label: '5×5', w: 5, h: 5 },
  { label: '10×10', w: 10, h: 10 },
];

export default function Home() {
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [purchasedCells, setPurchasedCells] = useState<Set<string>>(new Set());
  const [cellImages, setCellImages] = useState<Map<string, CellImageData>>(new Map());
  const [cellToAnchor, setCellToAnchor] = useState<Map<string, string>>(new Map());
  const [randomMode, setRandomMode] = useState(false);
  const [buyMode, setBuyMode] = useState(false);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [sizePopup, setSizePopup] = useState(false);
  const [customN, setCustomN] = useState('');
  const [highlightedBlock, setHighlightedBlock] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [myCells, setMyCells] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false);
  const [cleanMode, setCleanMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchX, setSearchX] = useState('');
  const [searchY, setSearchY] = useState('');
  const gridRef = useRef<GridHandle>(null);
  const [pendingBlockAnchor, setPendingBlockAnchor] = useState<{ x: number; y: number } | null>(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    isTouchDevice.current = window.matchMedia('(pointer: coarse)').matches;
    return () => document.body.classList.remove('no-scroll');
  }, []);


  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const x = Math.min(1000, Math.max(1, Number(searchX) || 1)) - 1;
    const y = Math.min(1000, Math.max(1, Number(searchY) || 1)) - 1;
    gridRef.current?.navigateTo(x, y, 1, 1, 10);
    setSearchOpen(false);
    setSearchX('');
    setSearchY('');
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadCells() {
      const { data } = await supabase.from('cells').select('x, y, width, height, image_url');
      if (data) {
        const set = new Set<string>();
        const images = new Map<string, CellImageData>();
        const anchorMap = new Map<string, string>();
        data.forEach((c) => {
          const w = c.width ?? 1;
          const h = c.height ?? 1;
          const anchor = `${c.x},${c.y}`;
          for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
              const key = `${c.x + dx},${c.y + dy}`;
              set.add(key);
              anchorMap.set(key, anchor);
            }
          }
          if (c.image_url) {
            images.set(anchor, { url: c.image_url, width: w, height: h });
          }
        });
        setPurchasedCells(set);
        setCellImages(images);
        setCellToAnchor(anchorMap);
      }
    }
    loadCells();
  }, []);

  function discoverFreeCell() {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * 1000);
      y = Math.floor(Math.random() * 1000);
    } while (purchasedCells.has(`${x},${y}`));
    const size = SIZES[sizeIndex];
    setPendingBlockAnchor(null);
    setHighlightedBlock({ x, y, width: size.w, height: size.h });
    gridRef.current?.navigateTo(x, y, size.w, size.h);
  }

  const anchorKey = selectedCell
    ? (cellToAnchor.get(`${selectedCell.x},${selectedCell.y}`) ?? `${selectedCell.x},${selectedCell.y}`)
    : null;
  const anchorCell = anchorKey
    ? { x: Number(anchorKey.split(',')[0]), y: Number(anchorKey.split(',')[1]) }
    : null;
  const imageData = anchorKey ? cellImages.get(anchorKey) : undefined;

  const customVal = Math.min(100, Math.max(1, Number(customN) || 1));
  const currentSize = sizeIndex === -1 && customN
    ? { label: `${customVal}×${customVal}`, w: customVal, h: customVal }
    : SIZES[sizeIndex] ?? SIZES[0];

  const fontBebas  = { fontFamily: 'var(--font-bebas)' } as const;
  const fontOxanium = { fontFamily: 'var(--font-oxanium)' } as const;
  const fontDm      = { fontFamily: 'var(--font-dm)' } as const;

  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: '#07070D' }}>

      {/* Atmospheric glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb-tr" />
        <div className="orb-bl" />
      </div>

      <Grid
        ref={gridRef}
        onCellClick={(cell) => {
          const isFree = !purchasedCells.has(`${cell.x},${cell.y}`);
          if ((isFree) && !user) {
            setAuthModal(true);
            return;
          }

          // On touch devices there's no hover preview, so multi-cell blocks need a
          // tap-to-preview, tap-again-to-confirm flow instead of a single tap.
          if (isTouchDevice.current && buyMode && isFree && (currentSize.w > 1 || currentSize.h > 1)) {
            const bx = Math.max(0, cell.x - currentSize.w + 1);
            const by = Math.max(0, cell.y - currentSize.h + 1);
            if (pendingBlockAnchor && pendingBlockAnchor.x === bx && pendingBlockAnchor.y === by) {
              setPendingBlockAnchor(null);
              setHighlightedBlock(null);
              setSelectedCell(cell);
            } else {
              setPendingBlockAnchor({ x: bx, y: by });
              setHighlightedBlock({ x: bx, y: by, width: currentSize.w, height: currentSize.h });
            }
            return;
          }

          setPendingBlockAnchor(null);
          setHighlightedBlock(null);
          setSelectedCell(cell);
        }}
        purchasedCells={purchasedCells}
        cellImages={cellImages}
        highlightedBlock={highlightedBlock}
        hoverBlockSize={buyMode ? currentSize : undefined}
      />

      {/* ── TOP LEFT — counter + leaderboard ── */}
      {!cleanMode && (
        <div className="absolute top-4 left-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 anim-tl">
          <div className="pointer-events-none">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="live-badge live-dot" />
              <span className="hidden sm:inline" style={{ ...fontOxanium, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                CELLS AVAILABLE
              </span>
            </div>
            <p style={{ ...fontOxanium, fontSize: '1rem', fontWeight: 600, color: '#fff' }} className="tabular-nums leading-none">
              {(1_000_000 - purchasedCells.size).toLocaleString('en-US')}
              <span className="hidden sm:inline" style={{ fontSize: '10px', fontWeight: 400, color: 'rgba(255,255,255,0.25)', marginLeft: '4px' }}>/ 1,000,000</span>
            </p>
          </div>
          <button
            className="btn-glass rounded-full flex items-center gap-1.5"
            style={{ ...fontDm, fontSize: '11px', padding: '5px 10px' }}
            onClick={() => setLeaderboard(true)}
          >
            <span>🏆</span>
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>
      )}

      {/* ── CENTER TOP — title + tagline ── */}
      {!cleanMode && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1
            className="anim-title leading-none tracking-widest text-white"
            style={{ ...fontBebas, letterSpacing: '0.18em' }}
          >
            <span className="sm:hidden" style={{ fontSize: '1rem' }}>Million Dollar Grid</span>
            <span className="hidden sm:inline" style={{ fontSize: '1.9rem' }}>Million Dollar Grid</span>
          </h1>
          <p
            className="anim-tag hidden sm:block"
            style={{ ...fontDm, fontSize: '9px', letterSpacing: '0.28em', color: 'var(--gold-dim)', marginTop: '4px', textTransform: 'uppercase' }}
          >
            The grid never forgets.
          </p>
        </div>
      )}

      {/* ── BOTTOM LEFT — info ── */}
      {!cleanMode && (
        <a
          href="/info"
          style={{ ...fontDm, fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}
          className="absolute bottom-20 sm:bottom-5 left-4 sm:left-5 hover:text-white transition-colors"
        >
          Info & Legal
        </a>
      )}

      {/* ── TOP RIGHT — user area ── */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 anim-tr">
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline" style={{ ...fontDm, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {user.user_metadata?.name ?? user.email}
              </span>
              <button
                className="btn-glass rounded-full"
                style={{ ...fontDm, fontSize: '11px', padding: '5px 12px' }}
                onClick={() => setMyCells(true)}
              >
                <span className="hidden sm:inline">📋 My Activity</span>
                <span className="sm:hidden">📋</span>
              </button>
              <a
                href="/account"
                className="btn-glass rounded-full flex items-center justify-center"
                style={{ width: '30px', height: '30px', fontSize: '13px' }}
                title="Account settings"
              >
                ⚙️
              </a>
            </>
          ) : (
            <button
              className="btn-glass rounded-full"
              style={{ ...fontDm, fontSize: '11px', padding: '5px 14px', fontWeight: 500 }}
              onClick={() => setAuthModal(true)}
            >
              Log in
            </button>
          )}
        </div>

        {/* Clean view toggle */}
        <button
          onClick={() => setCleanMode((v) => !v)}
          className="flex items-center gap-1.5 rounded-full transition-all"
          style={{
            ...fontDm,
            fontSize: '10px',
            padding: '4px 10px',
            background: cleanMode ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${cleanMode ? 'var(--gold)' : 'rgba(255,255,255,0.07)'}`,
            color: cleanMode ? '#000' : 'rgba(255,255,255,0.35)',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '18px',
            height: '10px',
            borderRadius: '99px',
            background: cleanMode ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              top: '2px',
              left: cleanMode ? '9px' : '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s ease',
            }} />
          </span>
          Clean view
        </button>
      </div>

      {/* ── BOTTOM CENTER — toolbar ── */}
      {!cleanMode && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 anim-bottom">
          {!buyMode ? (
            <div className="toolbar rounded-full flex items-center gap-0.5 p-1">
              <button
                className="btn-glass rounded-full"
                style={{ ...fontDm, fontSize: '11px', fontWeight: 500, padding: '6px 14px', border: 'none', background: 'transparent' }}
                onClick={() => setRandomMode(true)}
              >
                🎲 Random
              </button>
              <div className="toolbar-divider mx-1" />
              <button
                className="btn-gold rounded-full"
                style={{ ...fontDm, fontSize: '11px', padding: '6px 16px' }}
                onClick={() => setBuyMode(true)}
              >
                🛒 Buy Options
              </button>
              <div className="toolbar-divider mx-1" />
              <div className="relative">
                <button
                  className="btn-glass rounded-full"
                  style={{ ...fontDm, fontSize: '11px', fontWeight: 500, padding: '6px 14px', border: 'none', background: 'transparent' }}
                  onClick={() => setSearchOpen((v) => !v)}
                >
                  🔍 Go to Cell
                </button>
                {searchOpen && (
                  <form
                    onSubmit={handleSearch}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
                    style={{ width: '210px', background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p style={{ ...fontDm, fontSize: '12px', fontWeight: 600, color: '#fff' }}>Go to cell</p>
                    <div className="flex gap-2">
                      <input
                        type="number" min={1} max={1000} placeholder="X"
                        value={searchX} onChange={(e) => setSearchX(e.target.value)}
                        style={{ ...fontOxanium, fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '8px 10px', outline: 'none', width: '100%' }}
                      />
                      <input
                        type="number" min={1} max={1000} placeholder="Y"
                        value={searchY} onChange={(e) => setSearchY(e.target.value)}
                        style={{ ...fontOxanium, fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '8px 10px', outline: 'none', width: '100%' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!searchX || !searchY}
                      className="btn-gold rounded-xl"
                      style={{ ...fontDm, fontSize: '12px', padding: '8px' }}
                    >
                      Jump
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="toolbar rounded-full flex items-center gap-0.5 p-1">
              <button
                className="btn-glass rounded-full"
                style={{ ...fontDm, fontSize: '11px', fontWeight: 500, padding: '6px 14px', border: 'none', background: 'transparent' }}
                onClick={discoverFreeCell}
              >
                🎲 Random Cell
              </button>
              <div className="toolbar-divider mx-1" />
              <div className="relative">
                {sizePopup && (
                  <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-2xl overflow-hidden shadow-2xl"
                    style={{ width: '110px', background: 'rgba(12,12,20,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
                  >
                    <input
                      type="number" min={1} max={100} placeholder="n×n"
                      value={customN} onChange={(e) => setCustomN(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && Number(customN) >= 1) { setSizeIndex(-1); setSizePopup(false); setPendingBlockAnchor(null); setHighlightedBlock(null); } }}
                      style={{ ...fontOxanium, fontSize: '12px', width: '100%', background: 'rgba(255,255,255,0.06)', color: '#fff', textAlign: 'center', padding: '8px', outline: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    {[{ label: '5×5' }, { label: '2×2' }, { label: '1×1' }].map((s, i) => (
                      <button
                        key={s.label}
                        style={{ ...fontDm, fontSize: '12px', width: '100%', color: 'rgba(255,255,255,0.7)', padding: '7px', display: 'block', textAlign: 'center' }}
                        className="hover:bg-white/5 transition-colors"
                        onClick={() => { setSizeIndex([2, 1, 0][i]); setSizePopup(false); setCustomN(''); setPendingBlockAnchor(null); setHighlightedBlock(null); }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="btn-glass rounded-full"
                  style={{ ...fontDm, fontSize: '11px', fontWeight: 500, padding: '6px 14px', border: 'none', background: 'transparent', minWidth: '64px' }}
                  onClick={() => setSizePopup((v) => !v)}
                >
                  {sizeIndex === -1 && customN ? `${customN}×${customN}` : currentSize.label} ▾
                </button>
              </div>
              <div className="toolbar-divider mx-1" />
              <button
                style={{ ...fontDm, fontSize: '11px', color: 'rgba(255,255,255,0.35)', padding: '6px 10px' }}
                className="hover:text-white transition-colors rounded-full"
                onClick={() => { setBuyMode(false); setHighlightedBlock(null); setSelectedCell(null); setPendingBlockAnchor(null); }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {!cleanMode && <RecentPurchases onNavigate={(x, y) => gridRef.current?.navigateTo(x, y, 1, 1, 10)} />}
      {myCells && user && <MyCells user={user} onClose={() => setMyCells(false)} onNavigate={(x, y) => { gridRef.current?.navigateTo(x, y, 1, 1, 10); }} />}
      {leaderboard && <Leaderboard onClose={() => setLeaderboard(false)} onNavigate={(x, y) => { gridRef.current?.navigateTo(x, y, 1, 1, 10); }} />}
      {authModal && <AuthModal onClose={() => setAuthModal(false)} />}
      {(randomMode || (selectedCell && imageData)) && (
        <RandomMode
          onClose={() => { setRandomMode(false); setSelectedCell(null); }}
          user={user}
          onLoginRequest={() => setAuthModal(true)}
          startAt={anchorCell && imageData ? anchorCell : undefined}
          cleanMode={cleanMode}
        />
      )}

      {selectedCell && !imageData && (
        <CellModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
          purchasedCells={purchasedCells}
          onBlockPreview={setHighlightedBlock}
          selectedSize={currentSize}
          user={user}
          onImageUploaded={(x, y, url) => {
            setCellImages((prev) => {
              const next = new Map(prev);
              next.set(`${x},${y}`, { url, width: 1, height: 1 });
              return next;
            });
            setSelectedCell(null);
          }}
        />
      )}
    </main>
  );
}
