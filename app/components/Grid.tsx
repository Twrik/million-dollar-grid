'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface GridHandle {
  navigateTo: (x: number, y: number, w?: number, h?: number, zoom?: number) => void;
  zoomBy: (factor: number) => void;
}

const GRID_SIZE = 1000;
const CELL_SIZE = 10;

export interface CellImageData {
  url: string;
  width: number;
  height: number;
}

interface GridProps {
  onCellClick: (cell: { x: number; y: number }) => void;
  purchasedCells: Set<string>;
  cellImages: Map<string, CellImageData>;
  highlightedBlock?: { x: number; y: number; width: number; height: number } | null;
  hoverBlockSize?: { w: number; h: number };
}

const Grid = forwardRef<GridHandle, GridProps>(function Grid({ onCellClick, purchasedCells, cellImages, highlightedBlock, hoverBlockSize }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(0.1);
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const hoveredCell = useRef<{ x: number; y: number } | null>(null);
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const cellImagesRef = useRef(cellImages);
  cellImagesRef.current = cellImages;
  const purchasedCellsRef = useRef(purchasedCells);
  purchasedCellsRef.current = purchasedCells;
  const highlightedBlockRef = useRef(highlightedBlock);
  highlightedBlockRef.current = highlightedBlock;
  const hoverBlockSizeRef = useRef(hoverBlockSize);
  hoverBlockSizeRef.current = hoverBlockSize;

  const getCellFromMouse = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const { x: ox, y: oy } = offsetRef.current;
    const scale = scaleRef.current;
    const cellX = Math.floor((mouseX - ox) / scale / CELL_SIZE);
    const cellY = Math.floor((mouseY - oy) / scale / CELL_SIZE);
    if (cellX < 0 || cellX >= GRID_SIZE || cellY < 0 || cellY >= GRID_SIZE) return null;
    return { x: cellX, y: cellY };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only reset canvas size when window size actually changes — avoids clearing context during pinch zoom
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const { x: ox, y: oy } = offsetRef.current;
    const scale = scaleRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // Visible border around the entire grid
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3 / scale;
    ctx.strokeRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // Pixel size of one cell in screen space
    const cellPx = scale * CELL_SIZE;

    // Draw purchased cells — always visible, minimum 1px
    purchasedCellsRef.current.forEach((key) => {
      const [cx, cy] = key.split(',').map(Number);
      if (!cellImagesRef.current.has(key)) {
        ctx.fillStyle = '#f59e0b';
        if (cellPx >= 2) {
          ctx.fillRect(cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
        } else {
          // sub-pixel: draw 1px dot in screen space
          ctx.save();
          ctx.resetTransform();
          const sx = Math.round(cx * CELL_SIZE * scale + ox);
          const sy = Math.round(cy * CELL_SIZE * scale + oy);
          ctx.fillRect(sx, sy, 2, 2);
          ctx.restore();
        }
      }
    });

    // Draw grid lines when zoomed in enough
    if (scale > 0.3) {
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1 / scale;

      const visStartX = Math.max(0, Math.floor(-ox / scale / CELL_SIZE));
      const visStartY = Math.max(0, Math.floor(-oy / scale / CELL_SIZE));
      const visEndX = Math.min(GRID_SIZE, Math.ceil((canvas.width - ox) / scale / CELL_SIZE) + 1);
      const visEndY = Math.min(GRID_SIZE, Math.ceil((canvas.height - oy) / scale / CELL_SIZE) + 1);

      for (let x = visStartX; x <= visEndX; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, visStartY * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE, visEndY * CELL_SIZE);
        ctx.stroke();
      }

      for (let y = visStartY; y <= visEndY; y++) {
        ctx.beginPath();
        ctx.moveTo(visStartX * CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(visEndX * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }
    }

    // Draw images only when zoomed in enough (at least 4px per cell)
    if (cellPx >= 4) {
      cellImagesRef.current.forEach((data, key) => {
        const [cx, cy] = key.split(',').map(Number);
        const img = loadedImages.current.get(key);
        const pw = data.width * CELL_SIZE - 1;
        const ph = data.height * CELL_SIZE - 1;
        if (img && img.complete) {
          ctx.drawImage(img, cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, pw, ph);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, pw, ph);
        }
      });
    } else {
      // Just show gold for image cells at low zoom
      cellImagesRef.current.forEach((data, key) => {
        const [cx, cy] = key.split(',').map(Number);
        ctx.fillStyle = '#f59e0b';
        if (cellPx >= 2) {
          ctx.fillRect(cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, data.width * CELL_SIZE - 1, data.height * CELL_SIZE - 1);
        } else {
          ctx.save();
          ctx.resetTransform();
          const sx = Math.round(cx * CELL_SIZE * scale + ox);
          const sy = Math.round(cy * CELL_SIZE * scale + oy);
          ctx.fillRect(sx, sy, Math.max(2, Math.round(data.width * cellPx)), Math.max(2, Math.round(data.height * cellPx)));
          ctx.restore();
        }
      });
    }

    // Draw highlighted block
    if (highlightedBlockRef.current) {
      const { x: hx, y: hy, width: hw, height: hh } = highlightedBlockRef.current;
      const bw = hw * CELL_SIZE - 2;
      const bh = hh * CELL_SIZE - 2;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(hx * CELL_SIZE + 1, hy * CELL_SIZE + 1, bw, bh);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(hx * CELL_SIZE + 1, hy * CELL_SIZE + 1, bw, bh);
    }

    // Draw hovered cell / block
    if (hoveredCell.current) {
      const { x: hx, y: hy } = hoveredCell.current;
      const hw = hoverBlockSizeRef.current?.w ?? 1;
      const hh = hoverBlockSizeRef.current?.h ?? 1;
      const bx = Math.max(0, hx - hw + 1);
      const by = Math.max(0, hy - hh + 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bx * CELL_SIZE + 1, by * CELL_SIZE + 1, hw * CELL_SIZE - 1, hh * CELL_SIZE - 1);
    }

    ctx.restore();
  }, []);

  useEffect(() => { draw(); }, [highlightedBlock, draw]);

  useEffect(() => {
    cellImages.forEach((data, key) => {
      if (loadedImages.current.has(key)) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw();
      img.src = data.url;
      loadedImages.current.set(key, img);
    });
  }, [cellImages, draw]);

  useEffect(() => {
    const scale = Math.min(window.innerWidth, window.innerHeight) / (GRID_SIZE * CELL_SIZE) * 0.92;
    scaleRef.current = scale;
    offsetRef.current = {
      x: (window.innerWidth - GRID_SIZE * CELL_SIZE * scale) / 2,
      y: (window.innerHeight - GRID_SIZE * CELL_SIZE * scale) / 2,
    };
    resizeCanvas();
    draw();
    const handleResize = () => { resizeCanvas(); draw(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw, resizeCanvas]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const oldScale = scaleRef.current;
    const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.05), 50);
    offsetRef.current = {
      x: mouseX - (mouseX - offsetRef.current.x) * (newScale / oldScale),
      y: mouseY - (mouseY - offsetRef.current.y) * (newScale / oldScale),
    };
    scaleRef.current = newScale;
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isMouseDown.current = true;
    isDragging.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (isMouseDown.current && !isDragging.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      offsetRef.current = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
    }
    lastPos.current = { x: e.clientX, y: e.clientY };
    hoveredCell.current = getCellFromMouse(e.clientX, e.clientY);
    draw();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isMouseDown.current = false;
    if (!isDragging.current) {
      const cell = getCellFromMouse(e.clientX, e.clientY);
      if (cell) onCellClick(cell);
    }
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isMouseDown.current = false;
    isDragging.current = false;
    hoveredCell.current = null;
    draw();
  };

  // Touch support
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef(false);
  const wasPinching = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isTouchDragging.current = false;
        lastTouchDist.current = null;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
        lastTouchMid.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        wasPinching.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        if (!isTouchDragging.current && touchStartPos.current) {
          const totalDx = e.touches[0].clientX - touchStartPos.current.x;
          const totalDy = e.touches[0].clientY - touchStartPos.current.y;
          if (Math.abs(totalDx) > 4 || Math.abs(totalDy) > 4) isTouchDragging.current = true;
        }
        if (isTouchDragging.current) {
          offsetRef.current = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
        }
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        draw();
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        const zoomFactor = dist / lastTouchDist.current;
        const oldScale = scaleRef.current;
        const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.05), 50);
        const rect = canvas.getBoundingClientRect();
        const pivotX = mid.x - rect.left;
        const pivotY = mid.y - rect.top;
        offsetRef.current = {
          x: pivotX - (pivotX - offsetRef.current.x) * (newScale / oldScale),
          y: pivotY - (pivotY - offsetRef.current.y) * (newScale / oldScale),
        };
        scaleRef.current = newScale;
        lastTouchDist.current = dist;
        lastTouchMid.current = mid;
        draw();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0 && e.changedTouches.length === 1 && !isTouchDragging.current && !wasPinching.current && touchStartPos.current) {
        const t = e.changedTouches[0];
        const cell = getCellFromMouse(t.clientX, t.clientY);
        if (cell) onCellClick(cell);
      }
      if (e.touches.length === 0) {
        lastTouchDist.current = null;
        isTouchDragging.current = false;
        touchStartPos.current = null;
        wasPinching.current = false;
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [draw, getCellFromMouse, onCellClick]);

  useImperativeHandle(ref, () => ({
    navigateTo(x: number, y: number, w = 1, h = 1, zoom = 3) {
      const targetScale = zoom;
      scaleRef.current = targetScale;
      offsetRef.current = {
        x: window.innerWidth / 2 - (x + w / 2) * CELL_SIZE * targetScale,
        y: window.innerHeight / 2 - (y + h / 2) * CELL_SIZE * targetScale,
      };
      draw();
    },
    zoomBy(factor: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pivotX = canvas.width / 2;
      const pivotY = canvas.height / 2;
      const oldScale = scaleRef.current;
      const newScale = Math.min(Math.max(oldScale * factor, 0.05), 50);
      offsetRef.current = {
        x: pivotX - (pivotX - offsetRef.current.x) * (newScale / oldScale),
        y: pivotY - (pivotY - offsetRef.current.y) * (newScale / oldScale),
      };
      scaleRef.current = newScale;
      draw();
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'block', cursor: 'grab', touchAction: 'none' }}
    />
  );
});

export default Grid;
