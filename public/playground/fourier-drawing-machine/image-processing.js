/* ======================================================
   Image Processing Pipeline v4
   Strategy: Binary mask → Marching squares → Smart stitch → Curvature resample
   Fixes: eliminates long straight bridge artifacts
   ====================================================== */

const ImageProcessor = (() => {

  // ===========================================================
  //  STEP 1: Image → Binary mask
  // ===========================================================

  function toGrayscale(imageData) {
    const { data, width: w, height: h } = imageData;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      const a = data[idx + 3] / 255;
      gray[i] = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) * a + 255 * (1 - a);
    }
    return gray;
  }

  function hasAlpha(imageData) {
    const data = imageData.data;
    let tp = 0, op = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) tp++; else op++;
    }
    const total = tp + op;
    return (tp / total) > 0.05 && (op / total) > 0.05;
  }

  function alphaMask(imageData) {
    const { data, width: w, height: h } = imageData;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0;
    return mask;
  }

  function otsuThreshold(gray) {
    const hist = new Int32Array(256);
    for (let i = 0; i < gray.length; i++) hist[Math.round(Math.min(255, Math.max(0, gray[i])))]++;
    const total = gray.length;
    let sumAll = 0;
    for (let i = 0; i < 256; i++) sumAll += i * hist[i];
    let sumBg = 0, wBg = 0, maxVar = 0, best = 128;
    for (let t = 0; t < 256; t++) {
      wBg += hist[t];
      if (wBg === 0) continue;
      const wFg = total - wBg;
      if (wFg === 0) break;
      sumBg += t * hist[t];
      const v = wBg * wFg * Math.pow(sumBg / wBg - (sumAll - sumBg) / wFg, 2);
      if (v > maxVar) { maxVar = v; best = t; }
    }
    return best;
  }

  function thresholdMask(gray, w, h, threshold, invert) {
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const dark = gray[i] < threshold;
      mask[i] = (invert ? !dark : dark) ? 1 : 0;
    }
    return mask;
  }

  function floodFillMask(gray, w, h, tolerance) {
    const mask = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) { queue.push(x); queue.push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { queue.push(y * w); queue.push(y * w + w - 1); }
    let borderSum = 0, borderCount = 0;
    for (const idx of queue) {
      if (!mask[idx]) { borderSum += gray[idx]; borderCount++; mask[idx] = 1; }
    }
    const ref = borderSum / borderCount;
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = idx % w, y = (idx - x) / w;
      const nb = [];
      if (x > 0) nb.push(idx - 1);
      if (x < w - 1) nb.push(idx + 1);
      if (y > 0) nb.push(idx - w);
      if (y < h - 1) nb.push(idx + w);
      for (const ni of nb) {
        if (!mask[ni] && Math.abs(gray[ni] - ref) < tolerance) { mask[ni] = 1; queue.push(ni); }
      }
    }
    const result = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) result[i] = mask[i] ? 0 : 1;
    return result;
  }

  // ===========================================================
  //  STEP 1.5: Clean up binary mask
  // ===========================================================

  function blurMask(mask, w, h, radius) {
    if (radius <= 0) return new Float32Array(mask);
    const temp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0, count = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < w) { sum += mask[y * w + nx]; count++; }
        }
        temp[y * w + x] = sum / count;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0, count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < h) { sum += temp[ny * w + x]; count++; }
        }
        out[y * w + x] = sum / count;
      }
    }
    return out;
  }

  function morphClose(mask, w, h, radius) {
    let dilated = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let found = false;
        for (let dy = -radius; dy <= radius && !found; dy++) {
          for (let dx = -radius; dx <= radius && !found; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w && mask[ny * w + nx]) found = true;
          }
        }
        dilated[y * w + x] = found ? 1 : 0;
      }
    }
    let eroded = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let allSet = true;
        for (let dy = -radius; dy <= radius && allSet; dy++) {
          for (let dx = -radius; dx <= radius && allSet; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) { if (!dilated[ny * w + nx]) allSet = false; }
          }
        }
        eroded[y * w + x] = allSet ? 1 : 0;
      }
    }
    return eroded;
  }

  // ===========================================================
  //  STEP 2: Binary mask → Contours via Marching Squares
  // ===========================================================

  function marchingSquares(field, w, h) {
    const threshold = 0.5;

    function val(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return 0;
      return field[y * w + x];
    }

    function lerp(v1, v2, x1, y1, x2, y2) {
      const t = (v1 === v2) ? 0.5 : (threshold - v1) / (v2 - v1);
      return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
    }

    function getSegments(cx, cy) {
      let idx = 0;
      if (val(cx, cy) >= threshold) idx |= 8;
      if (val(cx + 1, cy) >= threshold) idx |= 4;
      if (val(cx + 1, cy + 1) >= threshold) idx |= 2;
      if (val(cx, cy + 1) >= threshold) idx |= 1;
      if (idx === 0 || idx === 15) return [];

      const tl = val(cx, cy), tr = val(cx + 1, cy);
      const br = val(cx + 1, cy + 1), bl = val(cx, cy + 1);
      const top = lerp(tl, tr, cx, cy, cx + 1, cy);
      const right = lerp(tr, br, cx + 1, cy, cx + 1, cy + 1);
      const bottom = lerp(bl, br, cx, cy + 1, cx + 1, cy + 1);
      const left = lerp(tl, bl, cx, cy, cx, cy + 1);

      switch (idx) {
        case 1: return [[bottom, left]];
        case 2: return [[right, bottom]];
        case 3: return [[right, left]];
        case 4: return [[top, right]];
        case 5: return [[top, left], [bottom, right]];
        case 6: return [[top, bottom]];
        case 7: return [[top, left]];
        case 8: return [[left, top]];
        case 9: return [[bottom, top]];
        case 10: return [[left, bottom], [top, right]];
        case 11: return [[right, top]];
        case 12: return [[left, right]];
        case 13: return [[right, bottom]];
        case 14: return [[left, bottom]];
        default: return [];
      }
    }

    // Collect all segments
    const allSegments = [];
    for (let cy = 0; cy < h - 1; cy++) {
      for (let cx = 0; cx < w - 1; cx++) {
        for (const seg of getSegments(cx, cy)) allSegments.push(seg);
      }
    }
    if (allSegments.length === 0) return [];

    // Chain segments into contours
    function pointKey(p) { return `${(p.x * 1000) | 0},${(p.y * 1000) | 0}`; }

    const endpointMap = new Map();
    for (let i = 0; i < allSegments.length; i++) {
      for (let end = 0; end < 2; end++) {
        const key = pointKey(allSegments[i][end]);
        if (!endpointMap.has(key)) endpointMap.set(key, []);
        endpointMap.get(key).push({ segIdx: i, end });
      }
    }

    const usedSeg = new Uint8Array(allSegments.length);
    const contours = [];

    for (let startSeg = 0; startSeg < allSegments.length; startSeg++) {
      if (usedSeg[startSeg]) continue;
      const chain = [allSegments[startSeg][0], allSegments[startSeg][1]];
      usedSeg[startSeg] = 1;

      for (let dir = 0; dir < 2; dir++) {
        let extended = true;
        while (extended) {
          extended = false;
          const pt = dir === 0 ? chain[chain.length - 1] : chain[0];
          const candidates = endpointMap.get(pointKey(pt));
          if (!candidates) break;
          for (const c of candidates) {
            if (usedSeg[c.segIdx]) continue;
            usedSeg[c.segIdx] = 1;
            const seg = allSegments[c.segIdx];
            if (dir === 0) chain.push(c.end === 0 ? seg[1] : seg[0]);
            else chain.unshift(c.end === 1 ? seg[0] : seg[1]);
            extended = true;
            break;
          }
        }
      }
      if (chain.length >= 10) contours.push(chain);
    }

    contours.sort((a, b) => b.length - a.length);
    return contours;
  }

  // ===========================================================
  //  STEP 3: Smart contour stitching (no straight-line bridges)
  // ===========================================================

  function ptDist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Stitch multiple contours into a single path.
   *
   * Strategy: Instead of the old "bridge and return" approach that
   * created two long straight lines per join, we now:
   *
   * 1. For each contour pair, find the closest points on both contours
   *    (not just endpoints — any point along the contour).
   * 2. Rotate/reorder the contours so those closest points become the
   *    junction points.
   * 3. Splice with a minimal 2-point bridge at the closest gap.
   *
   * This means bridges are always as short as possible, and there's
   * no backtracking.
   */
  function stitchContours(contours, maxContours) {
    if (contours.length === 0) return [];
    if (contours.length === 1) return contours[0];

    const toStitch = contours.slice(0, Math.min(maxContours, contours.length));
    if (toStitch.length === 1) return toStitch[0];

    // Deep-copy contours so we can rotate them
    const pools = toStitch.map(c => c.map(p => ({ ...p })));
    const used = new Uint8Array(pools.length);
    used[0] = 1;

    let result = pools[0];

    for (let iter = 1; iter < pools.length; iter++) {
      // Find the closest point-pair between 'result' and any unused contour
      let bestDist = Infinity;
      let bestContour = -1;
      let bestResultIdx = 0;
      let bestContourIdx = 0;

      // Sample result at intervals to keep O(n) manageable
      const resultStep = Math.max(1, Math.floor(result.length / 200));

      for (let c = 0; c < pools.length; c++) {
        if (used[c]) continue;
        const cont = pools[c];
        const contStep = Math.max(1, Math.floor(cont.length / 200));

        for (let ri = 0; ri < result.length; ri += resultStep) {
          for (let ci = 0; ci < cont.length; ci += contStep) {
            const d = ptDist(result[ri], cont[ci]);
            if (d < bestDist) {
              bestDist = d;
              bestContour = c;
              bestResultIdx = ri;
              bestContourIdx = ci;
            }
          }
        }

        // Refine: search near the best found indices at full resolution
        if (bestContour === c) {
          const rStart = Math.max(0, bestResultIdx - resultStep);
          const rEnd = Math.min(result.length, bestResultIdx + resultStep);
          const cStart = Math.max(0, bestContourIdx - contStep);
          const cEnd = Math.min(cont.length, bestContourIdx + contStep);
          for (let ri = rStart; ri < rEnd; ri++) {
            for (let ci = cStart; ci < cEnd; ci++) {
              const d = ptDist(result[ri], cont[ci]);
              if (d < bestDist) {
                bestDist = d;
                bestResultIdx = ri;
                bestContourIdx = ci;
              }
            }
          }
        }
      }

      if (bestContour < 0) break;
      used[bestContour] = 1;

      const cont = pools[bestContour];

      // Rotate the next contour so bestContourIdx becomes index 0
      const rotated = cont.slice(bestContourIdx).concat(cont.slice(0, bestContourIdx));

      // Insert into result at bestResultIdx:
      // result[0..bestResultIdx] → bridge to rotated → rotated → bridge back → result[bestResultIdx..]
      // BUT instead of bridging back, we just splice it in place.
      // This leaves one short bridge (from result[bestResultIdx] to rotated[0])
      // and one bridge from rotated[end] back to result[bestResultIdx].
      // To minimize: we traverse the sub-contour as a loop and return to the splice point.
      const before = result.slice(0, bestResultIdx + 1);
      const after = result.slice(bestResultIdx);

      // The "bridge" is just the gap between result[bestResultIdx] and rotated[0]
      // which we found to be the shortest possible distance.
      result = [
        ...before,
        ...rotated,
        rotated[0],   // close the sub-loop
        result[bestResultIdx], // return to splice point (short bridge back)
        ...after,
      ];
    }

    return result;
  }

  // ===========================================================
  //  STEP 3.5: Collapse long straight segments
  // ===========================================================

  /**
   * After stitching, detect stretches that are nearly straight and
   * much longer than the average segment. Replace them with just
   * their endpoints. This starves bridges of sample points.
   */
  function collapseStraightSegments(points, avgSegLen) {
    if (points.length < 10) return points;

    const maxStraightLen = avgSegLen * 4; // anything 4x the average segment is suspicious

    const result = [points[0]];
    let runStart = 0;

    for (let i = 1; i < points.length - 1; i++) {
      const totalDist = ptDist(points[runStart], points[i + 1]);
      // Measure how straight the run from runStart to i+1 is
      // by checking the max deviation of intermediate points from the line
      const maxDev = maxDeviation(points, runStart, i + 1);
      const runLen = ptDist(points[runStart], points[i]);

      if (maxDev < 1.5 && runLen > maxStraightLen) {
        // This is a long straight segment — skip intermediate points
        continue;
      } else {
        // Not straight or not long — emit the point
        result.push(points[i]);
        runStart = i;
      }
    }
    result.push(points[points.length - 1]);
    return result;
  }

  function maxDeviation(points, start, end) {
    const dx = points[end].x - points[start].x;
    const dy = points[end].y - points[start].y;
    const lenSq = dx * dx + dy * dy;
    let maxD = 0;
    for (let i = start + 1; i < end; i++) {
      let d;
      if (lenSq === 0) {
        d = ptDist(points[i], points[start]);
      } else {
        const t = Math.max(0, Math.min(1,
          ((points[i].x - points[start].x) * dx + (points[i].y - points[start].y) * dy) / lenSq));
        const px = points[start].x + t * dx;
        const py = points[start].y + t * dy;
        d = ptDist(points[i], { x: px, y: py });
      }
      if (d > maxD) maxD = d;
    }
    return maxD;
  }

  // ===========================================================
  //  STEP 4: Curvature-weighted resampling
  // ===========================================================

  /**
   * Instead of uniform resampling (which gives bridges the same
   * density as curves), weight by curvature: curvy parts get more
   * points, straight parts get fewer. This means the Fourier
   * transform focuses its energy on the actual shape, not the bridges.
   */
  function resampleWeighted(points, targetCount) {
    if (points.length < 3 || targetCount < 3) return points;

    // 1. Compute per-vertex curvature (angle change)
    const N = points.length;
    const curvature = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const prev = points[(i - 1 + N) % N];
      const curr = points[i];
      const next = points[(i + 1) % N];
      const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
      const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
      const dot = dx1 * dx2 + dy1 * dy2;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const denom = len1 * len2;
      curvature[i] = denom > 0 ? cross / denom : 0;
    }

    // 2. Compute cumulative arc length
    const segLen = new Float32Array(N);
    const cumLen = new Float32Array(N + 1);
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      segLen[i] = ptDist(points[i], points[next]);
      cumLen[i + 1] = cumLen[i] + segLen[i];
    }
    const totalLen = cumLen[N];
    if (totalLen === 0) return points;

    // 3. Compute per-segment weight: base + curvature bonus
    // Higher curvature segments get more density
    const weight = new Float32Array(N);
    let totalWeight = 0;
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      const curv = (curvature[i] + curvature[next]) / 2;
      // Base weight = segment length, boosted by curvature
      // Straight segments (curv≈0) get weight = segLen * 0.2
      // Curved segments get weight = segLen * (0.2 + curvature * boost)
      const curvBoost = Math.min(curv * 8, 3); // cap the boost
      weight[i] = segLen[i] * (0.15 + curvBoost);
      totalWeight += weight[i];
    }

    // 4. Compute cumulative weight for sampling
    const cumWeight = new Float32Array(N + 1);
    for (let i = 0; i < N; i++) {
      cumWeight[i + 1] = cumWeight[i] + weight[i];
    }

    // 5. Sample uniformly in weight-space
    const step = totalWeight / targetCount;
    const result = [];
    for (let i = 0; i < targetCount; i++) {
      const target = i * step;
      // Binary search for segment
      let lo = 0, hi = N;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cumWeight[mid] <= target) lo = mid; else hi = mid;
      }
      const segIdx = lo;
      const nextIdx = (segIdx + 1) % N;
      const segWeight = weight[segIdx];
      const t = segWeight > 0 ? (target - cumWeight[segIdx]) / segWeight : 0;
      result.push({
        x: points[segIdx].x + t * (points[nextIdx].x - points[segIdx].x),
        y: points[segIdx].y + t * (points[nextIdx].y - points[segIdx].y),
      });
    }
    return result;
  }

  // ===========================================================
  //  STEP 5: Simplify (RDP) + Center
  // ===========================================================

  function simplifyRDP(points, epsilon) {
    if (epsilon <= 0 || points.length < 3) return points;
    function perpDist(pt, a, b) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return ptDist(pt, a);
      const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
      return ptDist(pt, { x: a.x + t * dx, y: a.y + t * dy });
    }
    function rdp(pts, s, e, eps) {
      let maxD = 0, maxI = s;
      for (let i = s + 1; i < e; i++) {
        const d = perpDist(pts[i], pts[s], pts[e]);
        if (d > maxD) { maxD = d; maxI = i; }
      }
      if (maxD > eps) {
        const left = rdp(pts, s, maxI, eps);
        const right = rdp(pts, maxI, e, eps);
        return left.slice(0, -1).concat(right);
      }
      return [pts[s], pts[e]];
    }
    return rdp(points, 0, points.length - 1, epsilon);
  }

  function centerPoints(points) {
    let cx = 0, cy = 0;
    for (const p of points) { cx += p.x; cy += p.y; }
    cx /= points.length; cy /= points.length;
    return { centered: points.map(p => ({ x: p.x - cx, y: p.y - cy })), cx, cy };
  }

  // ===========================================================
  //  MAIN PIPELINE
  // ===========================================================

  function process(imageData, w, h, options = {}) {
    const {
      mode = 'auto',
      detail = 50,
      sensitivity = 50,
      invert = false,
    } = options;

    const targetPoints = Math.round(200 + (detail / 100) * 1000);
    const simplifyEps = Math.max(0.3, 3 - (detail / 100) * 2.5);

    let mask;
    let usedMode = mode;

    if (mode === 'auto') {
      if (hasAlpha(imageData)) {
        mask = alphaMask(imageData);
        usedMode = 'alpha';
      } else {
        const gray = toGrayscale(imageData);
        const thresh = otsuThreshold(gray);
        mask = thresholdMask(gray, w, h, thresh, false);
        usedMode = 'threshold (Otsu)';
        let fgCount = 0;
        for (let i = 0; i < mask.length; i++) fgCount += mask[i];
        const fgRatio = fgCount / mask.length;
        if (fgRatio < 0.02 || fgRatio > 0.98) {
          mask = floodFillMask(gray, w, h, 40);
          usedMode = 'flood fill';
        }
      }
    } else if (mode === 'threshold') {
      const gray = toGrayscale(imageData);
      const thresh = 20 + (sensitivity / 100) * 215;
      mask = thresholdMask(gray, w, h, thresh, invert);
      usedMode = 'threshold';
    } else if (mode === 'flood') {
      const gray = toGrayscale(imageData);
      const tolerance = 10 + (sensitivity / 100) * 90;
      mask = floodFillMask(gray, w, h, tolerance);
      usedMode = 'flood fill';
      if (invert) { for (let i = 0; i < mask.length; i++) mask[i] = mask[i] ? 0 : 1; }
    }

    mask = morphClose(mask, w, h, 2);
    const blurred = blurMask(mask, w, h, 2);
    const contours = marchingSquares(blurred, w, h);

    if (contours.length === 0) {
      return { mask, contours: [], finalContour: [], usedMode, cx: 0, cy: 0 };
    }

    // Stitch with minimal bridges
    const stitched = stitchContours(contours, 5);

    // Compute average segment length to detect anomalous straight runs
    let totalSegLen = 0;
    for (let i = 1; i < stitched.length; i++) totalSegLen += ptDist(stitched[i - 1], stitched[i]);
    const avgSeg = stitched.length > 1 ? totalSegLen / (stitched.length - 1) : 1;

    // Collapse long straight bridges
    const collapsed = collapseStraightSegments(stitched, avgSeg);

    // Simplify
    const simplified = simplifyRDP(collapsed, simplifyEps);

    // Curvature-weighted resampling (curves get more points, bridges get fewer)
    const resampled = resampleWeighted(simplified, targetPoints);

    // Center
    const { centered, cx, cy } = centerPoints(resampled);

    return { mask, contours, finalContour: centered, usedMode, cx, cy };
  }

  // ===========================================================
  //  PREVIEW RENDERING
  // ===========================================================

  function renderMaskPreview(mask, w, h, canvas) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = mask[i] ? 255 : 0;
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function renderContourPreview(contour, w, h, canvas, cx, cy) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);
    if (contour.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(contour[0].x + cx, contour[0].y + cy);
    for (let i = 1; i < contour.length; i++) ctx.lineTo(contour[i].x + cx, contour[i].y + cy);
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /**
   * Given an already-edited mask, run contour extraction + stitch + resample.
   * Returns the same shape as process() but skips mask generation.
   */
  function processFromMask(editedMask, w, h, options = {}) {
    const { detail = 50 } = options;
    const targetPoints = Math.round(200 + (detail / 100) * 1000);
    const simplifyEps = Math.max(0.3, 3 - (detail / 100) * 2.5);

    const cleaned = morphClose(editedMask, w, h, 2);
    const blurred = blurMask(cleaned, w, h, 2);
    const contours = marchingSquares(blurred, w, h);

    if (contours.length === 0) {
      return { mask: editedMask, contours: [], finalContour: [], usedMode: 'edited', cx: 0, cy: 0 };
    }

    const stitched = stitchContours(contours, 5);
    let totalSegLen = 0;
    for (let i = 1; i < stitched.length; i++) totalSegLen += ptDist(stitched[i - 1], stitched[i]);
    const avgSeg = stitched.length > 1 ? totalSegLen / (stitched.length - 1) : 1;
    const collapsed = collapseStraightSegments(stitched, avgSeg);
    const simplified = simplifyRDP(collapsed, simplifyEps);
    const resampled = resampleWeighted(simplified, targetPoints);
    const { centered, cx, cy } = centerPoints(resampled);

    return { mask: editedMask, contours, finalContour: centered, usedMode: 'edited', cx, cy };
  }

  // ===========================================================
  //  SELECTION MODE: Edge detection within painted region
  //  Solves the problem of users painting broadly (not along edges)
  //  by finding real edges in the original image, clipped to the
  //  user's selection.
  // ===========================================================

  function sobelEdges(gray, w, h) {
    const mag = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const tl = gray[(y-1)*w+(x-1)], tc = gray[(y-1)*w+x], tr = gray[(y-1)*w+(x+1)];
        const ml = gray[y*w+(x-1)],                            mr = gray[y*w+(x+1)];
        const bl = gray[(y+1)*w+(x-1)], bc = gray[(y+1)*w+x], br = gray[(y+1)*w+(x+1)];
        const gx = -tl + tr - 2*ml + 2*mr - bl + br;
        const gy = -tl - 2*tc - tr + bl + 2*bc + br;
        mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return mag;
  }

  /**
   * Process with a user selection (paintMask).
   * Instead of blanking non-selected pixels (which creates false edges
   * at the paint boundary), we:
   * 1. Run Sobel on the full original image
   * 2. Threshold the edge magnitude to get an edge mask
   * 3. AND the edge mask with the user's paint selection
   * 4. Morph-close to connect nearby edges within the selection
   * 5. Run marching squares on the result
   */
  function processSelected(imageData, paintMask, w, h, options = {}) {
    const {
      detail = 50,
      sensitivity = 50,
    } = options;

    const targetPoints = Math.round(200 + (detail / 100) * 1000);
    const simplifyEps = Math.max(0.3, 3 - (detail / 100) * 2.5);

    // Sobel on original
    const gray = toGrayscale(imageData);
    const edges = sobelEdges(gray, w, h);

    // Find max edge magnitude for normalization
    let maxEdge = 0;
    for (let i = 0; i < w * h; i++) {
      if (edges[i] > maxEdge) maxEdge = edges[i];
    }
    if (maxEdge === 0) maxEdge = 1;

    // Threshold: sensitivity controls how strong an edge must be
    // Low sensitivity = only strong edges, high = more edges
    const edgeThresh = (1 - sensitivity / 100) * 0.35 + 0.02;

    // Build edge mask clipped to selection
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (paintMask[i] && (edges[i] / maxEdge) > edgeThresh) {
        mask[i] = 1;
      }
    }

    // Dilate the edge mask slightly to connect nearby edges
    const dilated = morphClose(mask, w, h, 3);

    // Blur for marching squares
    const blurred = blurMask(dilated, w, h, 1);
    const contours = marchingSquares(blurred, w, h);

    if (contours.length === 0) {
      return { mask: dilated, contours: [], finalContour: [], usedMode: 'edges in selection', cx: 0, cy: 0 };
    }

    const stitched = stitchContours(contours, 5);
    let totalSegLen = 0;
    for (let i = 1; i < stitched.length; i++) totalSegLen += ptDist(stitched[i - 1], stitched[i]);
    const avgSeg = stitched.length > 1 ? totalSegLen / (stitched.length - 1) : 1;
    const collapsed = collapseStraightSegments(stitched, avgSeg);
    const simplified = simplifyRDP(collapsed, simplifyEps);
    const resampled = resampleWeighted(simplified, targetPoints);
    const { centered, cx, cy } = centerPoints(resampled);

    return { mask: dilated, contours, finalContour: centered, usedMode: 'edges in selection', cx, cy };
  }

  return { process, processFromMask, processSelected, renderMaskPreview, renderContourPreview, hasAlpha };
})();
