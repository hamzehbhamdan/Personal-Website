/* ======================================================
   Fourier Drawing Machine — Main App v5
   Three input modes: Whole Image, Select+Edge, Freehand Draw
   ====================================================== */
/* global ImageProcessor */

// ---- Viz state ----
let contourPoints = [];
let fourierCoeffs = [];
let drawnPath = [];
let time = 0;
let isPlaying = true;
let animFrameId = null;
let numTerms = 80;
let speedMultiplier = 1;
let showCircles = true;
let showRadii = true;
let showPath = true;
let showOriginal = true;
let canvasCenter = { x: 0, y: 0 };
let scale = 1;
let drawingColor = '#ffffff';
let isPaused = false;
let pauseStart = 0;
const PAUSE_DURATION = 1000;

// ---- Image state ----
let currentImage = null;
let processedW = 0;
let processedH = 0;
let processedImageData = null;
let lastResult = null;
let currentMode = 'auto';

// ---- Paint state (select mode) ----
let paintMask = null;
let brushSize = 30;
let isPainting = false;
let hasPainted = false;
let previewPhase = 'paint'; // 'paint' or 'result'

// ---- Input mode: 'whole', 'select', 'draw' ----
let inputMode = 'whole';

// ---- Freehand drawing state ----
let freehandPoints = [];
let isDrawingFreehand = false;
let freehandLastPos = null;
let drawLineWidth = 2;

// ---- DOM ----
const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);
const sections = {
  upload: qs('#upload-section'),
  preview: qs('#preview-section'),
  viz: qs('#viz-section'),
};
const canvas = qs('#fourier-canvas');
const ctx = canvas.getContext('2d');
const processCanvas = qs('#process-canvas');
const processCtx = processCanvas.getContext('2d', { willReadFrequently: true });

function showSection(name) {
  Object.values(sections).forEach(s => s.classList.remove('active'));
  sections[name].classList.add('active');
  if (name === 'viz') requestResize();
}

// ============================================================
//  Upload + Input Mode Selection
// ============================================================

const dropZone = qs('#drop-zone');
const fileInput = qs('#file-input');

// Default drop/click = whole image mode
dropZone.addEventListener('click', () => { inputMode = 'whole'; fileInput.click(); });
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { inputMode = 'whole'; fileInput.click(); } });
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length) { inputMode = 'whole'; loadImage(e.dataTransfer.files[0]); }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) loadImage(fileInput.files[0]);
});

// Upload + Select mode
qs('#mode-select-btn').addEventListener('click', () => {
  inputMode = 'select';
  fileInput.click();
});

// Freehand draw mode
qs('#mode-draw-btn').addEventListener('click', () => {
  inputMode = 'draw';
  showSection('preview');
  enterDrawPhase();
});

// Samples — always whole-image
qsa('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => startVisualization(generateSamplePoints(btn.dataset.sample)));
});

function generateSamplePoints(type) {
  const N = 500;
  const pts = [];
  if (type === 'star') {
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const spike = i % (N / 5) < N / 10 ? 1 : 0.45;
      pts.push({ x: Math.cos(angle - Math.PI / 2) * 180 * spike, y: Math.sin(angle - Math.PI / 2) * 180 * spike });
    }
  } else if (type === 'heart') {
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push({
        x: 16 * Math.pow(Math.sin(t), 3) * 11,
        y: -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 11,
      });
    }
  } else if (type === 'treble') {
    const segs = [
      ...Array.from({ length: 150 }, (_, i) => { const t = (i/150)*Math.PI*2.5; const r = 30+t*18; return { x: Math.cos(t+Math.PI)*r*0.6, y: Math.sin(t+Math.PI)*r+40 }; }),
      ...Array.from({ length: 100 }, (_, i) => { const t = i/100; return { x: -10+Math.sin(t*Math.PI)*25, y: 40-t*320 }; }),
      ...Array.from({ length: 100 }, (_, i) => { const t = (i/100)*Math.PI; return { x: -10+Math.cos(t)*50, y: -280+Math.sin(t)*40 }; }),
      ...Array.from({ length: 150 }, (_, i) => { const t = i/150; return { x: -10-Math.sin(t*Math.PI*0.5)*30, y: -280+t*320 }; }),
    ];
    return segs;
  }
  return pts;
}

// ============================================================
//  Image loading
// ============================================================

function loadImage(file) {
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    prepareImage(img);
    showSection('preview');
    if (inputMode === 'whole') {
      enterWholePhase();
    } else if (inputMode === 'select') {
      enterPaintPhase();
    }
  };
  img.onerror = () => alert('Could not load image.');
  img.src = URL.createObjectURL(file);
}

function prepareImage(img) {
  const maxDim = 500;
  let w = img.naturalWidth, h = img.naturalHeight;
  const r = Math.min(maxDim / w, maxDim / h, 1);
  w = Math.round(w * r); h = Math.round(h * r);

  processCanvas.width = w;
  processCanvas.height = h;
  processCtx.clearRect(0, 0, w, h);
  processCtx.drawImage(img, 0, 0, w, h);
  processedW = w;
  processedH = h;
  processedImageData = processCtx.getImageData(0, 0, w, h);

  // Set up paint canvases (used in select mode)
  const oc = qs('#original-canvas');
  oc.width = w; oc.height = h;
  oc.getContext('2d').drawImage(img, 0, 0, w, h);

  const po = qs('#paint-overlay');
  po.width = w; po.height = h;

  const pc = qs('#paint-cursor');
  pc.width = w; pc.height = h;

  // Reset paint state
  paintMask = new Uint8Array(w * h);
  hasPainted = false;
}

// ============================================================
//  Whole Image Mode — straightforward: show preview → process
// ============================================================

function enterWholePhase() {
  previewPhase = 'paint'; // reuse phase naming for state management
  qs('#preview-title').textContent = 'Process Image';
  qs('#mode-info').textContent = 'The entire image will be processed. Adjust settings after processing.';
  qs('#paint-controls').style.display = 'none';
  qs('#draw-controls').style.display = 'none';
  qs('#process-controls').style.display = 'none';
  qs('#paint-area').style.display = 'none';
  qs('#draw-area').style.display = 'none';
  qs('#whole-area').style.display = '';
  qs('#result-area').style.display = 'none';
  qs('#process-btn').style.display = '';
  qs('#run-fourier-btn').style.display = 'none';

  // Render whole image preview
  const wc = qs('#whole-preview-canvas');
  wc.width = processedW;
  wc.height = processedH;
  wc.getContext('2d').drawImage(currentImage, 0, 0, processedW, processedH);
}

// ============================================================
//  Select Mode — paint-first, process-second with edge detection
// ============================================================

function enterPaintPhase() {
  previewPhase = 'paint';
  qs('#preview-title').textContent = 'Select & Process';
  qs('#paint-controls').style.display = '';
  qs('#draw-controls').style.display = 'none';
  qs('#process-controls').style.display = 'none';
  qs('#paint-area').style.display = '';
  qs('#whole-area').style.display = 'none';
  qs('#draw-area').style.display = 'none';
  qs('#result-area').style.display = 'none';
  qs('#process-btn').style.display = '';
  qs('#run-fourier-btn').style.display = 'none';
  qs('#mode-info').textContent = 'Paint over the parts of the image you want drawn. Edges will be detected within your selection.';
  qs('#paint-area-label').textContent = 'Paint the areas you want included';

  // Clear paint overlay
  const po = qs('#paint-overlay');
  po.getContext('2d').clearRect(0, 0, po.width, po.height);
  paintMask = new Uint8Array(processedW * processedH);
  hasPainted = false;
}

function enterResultPhase() {
  previewPhase = 'result';
  qs('#paint-controls').style.display = 'none';
  qs('#draw-controls').style.display = 'none';
  qs('#process-controls').style.display = '';
  qs('#paint-area').style.display = 'none';
  qs('#whole-area').style.display = 'none';
  qs('#draw-area').style.display = 'none';
  qs('#result-area').style.display = '';
  qs('#process-btn').style.display = 'none';
  qs('#run-fourier-btn').style.display = '';
}

// ============================================================
//  Freehand Drawing Mode
// ============================================================

const DRAW_CANVAS_SIZE = 500;

function enterDrawPhase() {
  previewPhase = 'paint';
  inputMode = 'draw';
  currentImage = null;
  qs('#preview-title').textContent = 'Freehand Draw';
  qs('#mode-info').textContent = 'Click on the canvas to start drawing. Click again to stop. Your line will be used directly.';
  qs('#paint-controls').style.display = 'none';
  qs('#draw-controls').style.display = '';
  qs('#process-controls').style.display = 'none';
  qs('#paint-area').style.display = 'none';
  qs('#whole-area').style.display = 'none';
  qs('#draw-area').style.display = '';
  qs('#result-area').style.display = 'none';
  qs('#process-btn').style.display = '';
  qs('#run-fourier-btn').style.display = 'none';

  // Set up draw canvas
  const dc = qs('#draw-canvas');
  dc.width = DRAW_CANVAS_SIZE;
  dc.height = DRAW_CANVAS_SIZE;
  const dcCtx = dc.getContext('2d');
  dcCtx.fillStyle = '#0a0a0f';
  dcCtx.fillRect(0, 0, DRAW_CANVAS_SIZE, DRAW_CANVAS_SIZE);

  // Reset freehand state
  freehandPoints = [];
  isDrawingFreehand = false;
  freehandLastPos = null;
  qs('#draw-status').textContent = 'Click on the canvas to start drawing';
  qs('.draw-canvas-wrap').classList.remove('drawing');
}

(function initFreehandDrawing() {
  const dc = qs('#draw-canvas');

  function getDrawPos(e) {
    const rect = dc.getBoundingClientRect();
    const sx = DRAW_CANVAS_SIZE / rect.width;
    const sy = DRAW_CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  }

  function renderFreehand() {
    const dcCtx = dc.getContext('2d');
    dcCtx.fillStyle = '#0a0a0f';
    dcCtx.fillRect(0, 0, DRAW_CANVAS_SIZE, DRAW_CANVAS_SIZE);

    if (freehandPoints.length < 2) return;

    dcCtx.beginPath();
    dcCtx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
    for (let i = 1; i < freehandPoints.length; i++) {
      dcCtx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
    }
    dcCtx.strokeStyle = '#ffffff';
    dcCtx.lineWidth = drawLineWidth;
    dcCtx.lineJoin = 'round';
    dcCtx.lineCap = 'round';
    dcCtx.stroke();
  }

  dc.addEventListener('click', (e) => {
    if (inputMode !== 'draw') return;

    if (!isDrawingFreehand) {
      // Start drawing
      isDrawingFreehand = true;
      freehandLastPos = getDrawPos(e);
      freehandPoints.push({ ...freehandLastPos });
      qs('#draw-status').textContent = 'Drawing... click to stop';
      qs('.draw-canvas-wrap').classList.add('drawing');
    } else {
      // Stop drawing
      isDrawingFreehand = false;
      freehandLastPos = null;
      qs('#draw-status').textContent = `Done — ${freehandPoints.length} points captured. Click to start a new stroke, or Process.`;
      qs('.draw-canvas-wrap').classList.remove('drawing');
    }
  });

  dc.addEventListener('pointermove', (e) => {
    if (inputMode !== 'draw' || !isDrawingFreehand) return;
    const pos = getDrawPos(e);

    // Only add point if it moved enough (avoid cluttering with micro-movements)
    if (freehandLastPos) {
      const dx = pos.x - freehandLastPos.x;
      const dy = pos.y - freehandLastPos.y;
      if (dx * dx + dy * dy < 4) return; // min 2px movement
    }

    freehandPoints.push({ x: pos.x, y: pos.y });
    freehandLastPos = pos;
    renderFreehand();
  });
})();

// ---- Paint overlay rendering ----

function renderPaintOverlay() {
  const po = qs('#paint-overlay');
  const poCtx = po.getContext('2d');
  const w = processedW, h = processedH;
  poCtx.clearRect(0, 0, w, h);

  if (!hasPainted) return;

  const imgData = poCtx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    if (paintMask[i]) {
      imgData.data[i * 4] = 92;
      imgData.data[i * 4 + 1] = 255;
      imgData.data[i * 4 + 2] = 177;
      imgData.data[i * 4 + 3] = 60;
    } else {
      imgData.data[i * 4] = 0;
      imgData.data[i * 4 + 1] = 0;
      imgData.data[i * 4 + 2] = 0;
      imgData.data[i * 4 + 3] = 140;
    }
  }
  poCtx.putImageData(imgData, 0, 0);
}

// ---- Painting interaction (select mode) ----
(function initPainting() {
  const cursorCanvas = qs('#paint-cursor');
  const cursorCtx = cursorCanvas.getContext('2d');
  let lastPos = null;

  function getCanvasPos(e) {
    const rect = cursorCanvas.getBoundingClientRect();
    const sx = processedW / rect.width;
    const sy = processedH / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  }

  function paintAt(x, y) {
    const r = brushSize;
    const w = processedW, h = processedH;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = Math.round(x + dx), py = Math.round(y + dy);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          paintMask[py * w + px] = 1;
        }
      }
    }
    hasPainted = true;
  }

  function paintLine(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.3)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      paintAt(from.x + dx * t, from.y + dy * t);
    }
  }

  function showCursor(e) {
    if (previewPhase !== 'paint' || inputMode !== 'select') return;
    const rect = cursorCanvas.getBoundingClientRect();
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    const displayR = brushSize * (rect.width / processedW);
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    const dpr = cursorCanvas.width / rect.width;
    cursorCtx.save();
    cursorCtx.beginPath();
    cursorCtx.arc(displayX * dpr, displayY * dpr, displayR * dpr, 0, Math.PI * 2);
    cursorCtx.strokeStyle = 'rgba(165,28,48,0.6)';
    cursorCtx.lineWidth = 1.5;
    cursorCtx.stroke();
    cursorCtx.restore();
  }

  cursorCanvas.style.pointerEvents = 'auto';

  cursorCanvas.addEventListener('pointerdown', e => {
    if (previewPhase !== 'paint' || inputMode !== 'select' || e.button !== 0) return;
    e.preventDefault();
    cursorCanvas.setPointerCapture(e.pointerId);
    isPainting = true;
    const pos = getCanvasPos(e);
    paintAt(pos.x, pos.y);
    lastPos = pos;
    renderPaintOverlay();
  });

  cursorCanvas.addEventListener('pointermove', e => {
    showCursor(e);
    if (!isPainting || previewPhase !== 'paint' || inputMode !== 'select') return;
    const pos = getCanvasPos(e);
    if (lastPos) paintLine(lastPos, pos);
    else paintAt(pos.x, pos.y);
    lastPos = pos;
    renderPaintOverlay();
  });

  cursorCanvas.addEventListener('pointerup', () => {
    isPainting = false;
    lastPos = null;
  });

  cursorCanvas.addEventListener('pointerleave', () => {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (isPainting) {
      isPainting = false;
      lastPos = null;
    }
  });
})();

// ---- Brush size slider ----
qs('#brush-size-slider').addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
  qs('#brush-size-value').textContent = brushSize;
});

// ---- Clear paint ----
qs('#clear-paint-btn').addEventListener('click', () => {
  paintMask = new Uint8Array(processedW * processedH);
  hasPainted = false;
  renderPaintOverlay();
});

// ---- Draw controls ----
qs('#draw-line-width').addEventListener('input', e => {
  drawLineWidth = parseInt(e.target.value);
  qs('#draw-line-width-value').textContent = drawLineWidth;
});

qs('#clear-draw-btn').addEventListener('click', () => {
  freehandPoints = [];
  isDrawingFreehand = false;
  freehandLastPos = null;
  const dc = qs('#draw-canvas');
  const dcCtx = dc.getContext('2d');
  dcCtx.fillStyle = '#0a0a0f';
  dcCtx.fillRect(0, 0, DRAW_CANVAS_SIZE, DRAW_CANVAS_SIZE);
  qs('#draw-status').textContent = 'Click on the canvas to start drawing';
  qs('.draw-canvas-wrap').classList.remove('drawing');
});

// ---- Process button ----
qs('#process-btn').addEventListener('click', () => {
  if (inputMode === 'draw') {
    processDrawing();
  } else {
    runProcessing();
  }
});

function getOptions() {
  return {
    mode: currentMode,
    sensitivity: parseInt(qs('#sensitivity-slider').value),
    detail: parseInt(qs('#detail-slider').value),
    invert: qs('#invert-toggle').checked,
  };
}

function runProcessing() {
  if (!processedImageData) return;
  const opts = getOptions();

  let result;
  if (inputMode === 'select' && hasPainted) {
    // Selection mode — use edge detection within painted region
    result = ImageProcessor.processSelected(processedImageData, paintMask, processedW, processedH, opts);
  } else {
    // Whole image mode (or select mode with no painting = treat as whole)
    result = ImageProcessor.process(processedImageData, processedW, processedH, opts);
  }

  lastResult = result;

  // Render black/white mask
  renderMaskResult(result.mask, processedW, processedH);

  // Render contour preview
  ImageProcessor.renderContourPreview(result.finalContour, processedW, processedH, qs('#contour-canvas'), result.cx, result.cy);

  // Update stats
  qs('#mode-used').textContent = result.usedMode;
  qs('#contour-count').textContent = result.contours.length;
  qs('#contour-length').textContent = result.finalContour.length;

  if (result.finalContour.length > 0) {
    qs('#mode-info').textContent = `Detected ${result.finalContour.length} points via ${result.usedMode}. Adjust settings or repaint.`;
  } else {
    qs('#mode-info').textContent = 'No outline found. Try painting a selection or adjusting settings.';
  }

  enterResultPhase();
}

function processDrawing() {
  if (freehandPoints.length < 10) {
    alert('Please draw more points before processing (at least 10).');
    return;
  }

  // Center the freehand points
  let cx = 0, cy = 0;
  for (const p of freehandPoints) { cx += p.x; cy += p.y; }
  cx /= freehandPoints.length;
  cy /= freehandPoints.length;

  const centered = freehandPoints.map(p => ({ x: p.x - cx, y: p.y - cy }));

  // Go directly to Fourier visualization
  startVisualization(centered);
}

function renderMaskResult(mask, w, h) {
  const mc = qs('#mask-canvas');
  mc.width = w; mc.height = h;
  const mCtx = mc.getContext('2d');
  const imgData = mCtx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = mask[i] ? 255 : 0;
    imgData.data[i * 4] = v;
    imgData.data[i * 4 + 1] = v;
    imgData.data[i * 4 + 2] = v;
    imgData.data[i * 4 + 3] = 255;
  }
  mCtx.putImageData(imgData, 0, 0);
}

// ---- Processing controls (re-run on change) ----
let processTimer = null;
function scheduleReprocess() {
  clearTimeout(processTimer);
  processTimer = setTimeout(runProcessing, 150);
}

function updateModeControls() {
  const isAuto = currentMode === 'auto';
  qs('#sensitivity-group').style.display = isAuto ? 'none' : '';
  qs('#detail-group').style.display = isAuto ? 'none' : '';
  qs('#invert-group').style.display = isAuto ? 'none' : '';
}

qsa('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    qsa('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    updateModeControls();
    scheduleReprocess();
  });
});
updateModeControls();

qs('#sensitivity-slider').addEventListener('input', e => {
  qs('#sensitivity-value').textContent = e.target.value;
  scheduleReprocess();
});

qs('#detail-slider').addEventListener('input', e => {
  qs('#detail-value').textContent = e.target.value;
  scheduleReprocess();
});

qs('#invert-toggle').addEventListener('change', () => {
  scheduleReprocess();
});

// ---- Repaint button: go back to paint phase ----
qs('#repaint-btn').addEventListener('click', () => {
  if (inputMode === 'whole') {
    enterWholePhase();
  } else if (inputMode === 'select') {
    enterPaintPhase();
    const oc = qs('#original-canvas');
    oc.getContext('2d').drawImage(currentImage, 0, 0, processedW, processedH);
    renderPaintOverlay();
  } else if (inputMode === 'draw') {
    enterDrawPhase();
  }
});

// Navigation
qs('#preview-back-btn').addEventListener('click', () => {
  showSection('upload');
  fileInput.value = '';
  currentImage = null;
  inputMode = 'whole';
});

qs('#run-fourier-btn').addEventListener('click', () => {
  if (!lastResult || lastResult.finalContour.length < 10) {
    alert('No clear outline detected. Try adjusting mode or sensitivity.');
    return;
  }
  startVisualization(lastResult.finalContour);
});

// ============================================================
//  DFT
// ============================================================

function computeDFT(points) {
  const N = points.length;
  const coeffs = [];
  const half = Math.floor(N / 2);
  for (let n = -half; n <= half; n++) {
    let re = 0, im = 0;
    for (let k = 0; k < N; k++) {
      const angle = (-2 * Math.PI * n * k) / N;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      re += points[k].x * cos - points[k].y * sin;
      im += points[k].x * sin + points[k].y * cos;
    }
    re /= N; im /= N;
    coeffs.push({ freq: n, re, im, amp: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) });
  }
  coeffs.sort((a, b) => b.amp - a.amp);
  return coeffs;
}

// ============================================================
//  Visualization
// ============================================================

function startVisualization(points) {
  contourPoints = points;
  fourierCoeffs = computeDFT(points);
  drawnPath = [];
  time = 0;
  isPaused = false;
  const adaptiveDefault = Math.min(Math.max(120, Math.round(points.length * 0.4)), fourierCoeffs.length);
  numTerms = adaptiveDefault;
  isPlaying = true;

  qs('#terms-slider').max = fourierCoeffs.length;
  qs('#terms-slider').value = numTerms;
  qs('#terms-value').textContent = numTerms;
  qs('#stat-points').textContent = points.length;
  qs('#stat-circles').textContent = numTerms;
  qs('#play-btn').classList.add('playing');

  window._fourierCoeffs = fourierCoeffs;
  window._numTerms = numTerms;
  showSection('viz');
  requestResize();
  startAnimation();
  setTimeout(drawReferenceImage, 50);
  if (typeof window.updateFormulaLive === 'function') window.updateFormulaLive();
}

function requestResize() {
  const container = qs('.viz-main');
  if (!container) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvasCenter = { x: rect.width / 2, y: rect.height / 2 };

  if (contourPoints.length > 0) {
    let maxR = 0;
    for (const p of contourPoints) {
      const r = Math.sqrt(p.x*p.x + p.y*p.y);
      if (r > maxR) maxR = r;
    }
    scale = maxR > 0 ? Math.min(rect.width, rect.height) * 0.38 / maxR : 1;
  }
}

function startAnimation() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  (function loop() {
    if (isPlaying) update();
    draw();
    animFrameId = requestAnimationFrame(loop);
  })();
}

function update() {
  if (isPaused) {
    if (performance.now() - pauseStart >= PAUSE_DURATION) {
      isPaused = false;
      time = 0;
      drawnPath = [];
    }
    return;
  }
  const dt = (2 * Math.PI) / contourPoints.length;
  time += dt * speedMultiplier;
  drawnPath.push(epicycleEndpoint(time));
  if (time >= 2 * Math.PI) {
    isPaused = true;
    pauseStart = performance.now();
    time = 2 * Math.PI;
    qs('#stat-progress').textContent = '100%';
    return;
  }
  qs('#stat-progress').textContent = `${Math.min(100, (time / (2 * Math.PI) * 100)).toFixed(0)}%`;
}

function epicycleEndpoint(t) {
  let x = 0, y = 0;
  const n = Math.min(numTerms, fourierCoeffs.length);
  for (let i = 0; i < n; i++) {
    const c = fourierCoeffs[i];
    const a = c.freq * t + c.phase;
    x += c.amp * Math.cos(a);
    y += c.amp * Math.sin(a);
  }
  return { x, y };
}

function draw() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(canvasCenter.x, canvasCenter.y);

  // Original outline
  if (showOriginal && contourPoints.length > 1) {
    ctx.beginPath();
    ctx.moveTo(contourPoints[0].x * scale, contourPoints[0].y * scale);
    for (let i = 1; i < contourPoints.length; i++) ctx.lineTo(contourPoints[i].x * scale, contourPoints[i].y * scale);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(108, 140, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Epicycles
  const n = Math.min(numTerms, fourierCoeffs.length);
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const c = fourierCoeffs[i];
    const radius = c.amp * scale;
    const angle = c.freq * time + c.phase;
    const nx = x + radius * Math.cos(angle);
    const ny = y + radius * Math.sin(angle);

    if (showCircles && radius > 0.5) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(108,140,255,${Math.max(0.04, 0.2 - i*0.003)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    if (showRadii && radius > 0.5) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `rgba(255,140,92,${Math.max(0.08, 0.35 - i*0.005)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    x = nx; y = ny;
  }

  // Tip dot
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ff8c5c';
  ctx.fill();

  // Drawing path
  if (showPath && drawnPath.length > 1) {
    const glowColor = hexToRgba(drawingColor, 0.25);
    const connColor = hexToRgba(drawingColor, 0.3);
    ctx.beginPath();
    ctx.moveTo(drawnPath[0].x * scale, drawnPath[0].y * scale);
    for (let i = 1; i < drawnPath.length; i++) ctx.lineTo(drawnPath[i].x * scale, drawnPath[i].y * scale);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Dashed connector
    if (!isPaused) {
      const last = drawnPath[drawnPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(last.x * scale, last.y * scale);
      ctx.strokeStyle = connColor;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---- Reference image ----
function drawReferenceImage() {
  const refCanvas = qs('#ref-canvas');
  const refContainer = qs('.ref-panel');
  if (!refCanvas || !refContainer) return;
  const showRef = qs('#show-reference') && qs('#show-reference').checked;
  refContainer.style.display = (showRef && currentImage) ? 'flex' : 'none';
  if (!showRef || !currentImage) return;

  const rCtx = refCanvas.getContext('2d');
  const container = refContainer.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cw = container.width;
  const ch = container.height - 28;
  if (cw <= 0 || ch <= 0) return;

  const iw = currentImage.naturalWidth;
  const ih = currentImage.naturalHeight;
  const fit = Math.min(cw / iw, ch / ih, 1);
  const dw = Math.round(iw * fit);
  const dh = Math.round(ih * fit);

  refCanvas.width = dw * dpr;
  refCanvas.height = dh * dpr;
  refCanvas.style.width = dw + 'px';
  refCanvas.style.height = dh + 'px';
  rCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rCtx.clearRect(0, 0, dw, dh);
  rCtx.drawImage(currentImage, 0, 0, dw, dh);
}

// ============================================================
//  Viz Controls
// ============================================================

qs('#terms-slider').addEventListener('input', e => {
  numTerms = parseInt(e.target.value);
  window._numTerms = numTerms;
  qs('#terms-value').textContent = numTerms;
  qs('#stat-circles').textContent = numTerms;
  drawnPath = []; time = 0;
  if (typeof window.updateFormulaLive === 'function') window.updateFormulaLive();
});

qs('#speed-slider').addEventListener('input', e => {
  speedMultiplier = parseInt(e.target.value) / 50;
  qs('#speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
});

qs('#show-circles').addEventListener('change', e => showCircles = e.target.checked);
qs('#show-radii').addEventListener('change', e => showRadii = e.target.checked);
qs('#show-path').addEventListener('change', e => showPath = e.target.checked);
qs('#show-original').addEventListener('change', e => showOriginal = e.target.checked);
qs('#show-reference').addEventListener('change', () => {
  drawReferenceImage();
  // After ref panel shows/hides, the viz-main width changes — recalculate
  setTimeout(() => {
    requestResize();
    drawnPath = [];
    time = 0;
  }, 50);
});

// Line color picker
qs('#line-color').addEventListener('input', e => {
  drawingColor = e.target.value;
  updateColorPresetActive();
});

// Color presets
qsa('.color-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    drawingColor = btn.dataset.color;
    qs('#line-color').value = drawingColor;
    updateColorPresetActive();
  });
});

function updateColorPresetActive() {
  qsa('.color-preset').forEach(b => {
    b.classList.toggle('active', b.dataset.color.toLowerCase() === drawingColor.toLowerCase());
  });
}
updateColorPresetActive();

qs('#play-btn').addEventListener('click', () => {
  isPlaying = !isPlaying;
  qs('#play-btn').classList.toggle('playing', isPlaying);
});

qs('#reset-btn').addEventListener('click', () => {
  drawnPath = []; time = 0; isPaused = false; isPlaying = true;
  qs('#play-btn').classList.add('playing');
});

qs('#back-btn').addEventListener('click', () => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = null;
  if (inputMode === 'draw') {
    showSection('preview');
    enterDrawPhase();
  } else {
    showSection(currentImage ? 'preview' : 'upload');
  }
});

window.addEventListener('resize', () => {
  requestResize();
  drawReferenceImage();
});

// ============================================================
//  Live Formula Panel — exposes window.updateFormulaLive()
//  Called after startVisualization(), slider changes, and
//  when the user opens the terms expansion panel.
// ============================================================

window.updateFormulaLive = function() {
  // Expose state for LaTeX copy
  window._fourierCoeffs = fourierCoeffs;
  window._numTerms = numTerms;

  const container = document.getElementById('formula-terms-live');
  if (!container || !fourierCoeffs.length) return;

  const n = Math.min(numTerms, fourierCoeffs.length);
  const MAX_SHOWN = 20; // Show more terms in the floating panel
  const shown = Math.min(n, MAX_SHOWN);

  function buildExp(freq) {
    if (freq === 0) return '';
    const sign = freq < 0 ? '−' : '';
    const coeff = Math.abs(freq) * 2;
    return `·e<sup>${sign}${coeff}πit/T</sup>`;
  }

  let html = '';
  for (let i = 0; i < shown; i++) {
    const c = fourierCoeffs[i];
    const freq = c.freq;
    const amp  = c.amp.toFixed(3);
    const phasePi = (c.phase / Math.PI).toFixed(2) + 'π';
    const freqLabel = freq === 0 ? 'n = 0' : freq > 0 ? `n = +${freq}` : `n = ${freq}`;
    const dir = freq === 0 ? 'offset' : freq > 0 ? `${Math.abs(freq)}× ↺` : `${Math.abs(freq)}× ↻`;
    html += `<div class="formula-term-row">
      <span class="formula-term-plus">${i === 0 ? '' : '+'}</span>
      <span class="formula-term-expr formula-cn-sm">${amp}${buildExp(freq)}</span>
      <span class="formula-term-live-info">${freqLabel} &nbsp;·&nbsp; ${dir} &nbsp;·&nbsp; ∠${phasePi}</span>
    </div>`;
  }

  if (n > MAX_SHOWN) {
    html += `<div class="formula-term-row formula-term-ellipsis">
      <span class="formula-term-plus">+</span>
      <span class="formula-term-expr">···</span>
      <span class="formula-term-live-info" style="color:var(--text-faint)">${n - MAX_SHOWN} more circle${n - MAX_SHOWN !== 1 ? 's' : ''}</span>
    </div>`;
  }

  container.innerHTML = html;
};

showSection('upload');
