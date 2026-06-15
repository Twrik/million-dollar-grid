'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface GridHandle {
  navigateTo: (x: number, y: number, w?: number, h?: number, zoom?: number) => void;
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: ox, y: oy } = offsetRef.current;
    const scale = scaleRef.current;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // Draw purchased cells as gold background (no image)
    ctx.fillStyle = '#f59e0b';
    purchasedCellsRef.current.forEach((key) => {
      const [cx, cy] = key.split(',').map(Number);
      if (!cellImagesRef.current.has(key)) {
        ctx.fillRect(cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    });

    // Draw grid lines when zoomed in enough — BEFORE images so lines stay below
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

    // Draw block images on top of grid lines
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
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

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
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'block', cursor: 'grab' }}
    />
  );
});

export default Grid;
