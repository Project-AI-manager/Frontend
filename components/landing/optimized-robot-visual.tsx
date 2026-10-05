"use client";

import { useEffect, useRef } from "react";

const POSTER = "/robot/poster-v8.webp";
const LOOP = "/robot/body-loop-v8.webm";
const WIDTH = 1024;
const HEIGHT = 715;
const HEAD_SIZE = 384;
const POSES = 360;
const TILE_COLUMNS = 15;
const TILES = POSES / TILE_COLUMNS;
const ATLAS_OFFSET = 7;
const COMPRESSED_CACHE_TILES = 8;
const DECODED_CACHE_TILES = 3;
const MAX_SPEED = 180;
const MAX_ACCELERATION = 1080;
const DEADZONE_ENTER = 28;
const DEADZONE_EXIT = 42;

const wrap = (angle: number) => ((angle % POSES) + POSES) % POSES;
const atlasIndex = (phase: number) => wrap(Math.round(phase) + ATLAS_OFFSET);
const tileFor = (phase: number) => Math.floor(atlasIndex(phase) / TILE_COLUMNS);

/** Native body motion with a ring of sharp, prerecorded head directions. */
export function OptimizedRobotVisual() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const headRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    const headCanvas = headRef.current;
    if (!stage || !video || !headCanvas) return;
    // Fast Refresh and Strict Mode can reuse DOM nodes with imperative styles.
    // A new effect starts from the complete poster, before loading new assets.
    video.style.opacity = "0";
    headCanvas.style.opacity = "0";
    if (posterRef.current) posterRef.current.style.opacity = "1";
    const context = headCanvas.getContext("2d", { alpha: true });
    context?.clearRect(0, 0, HEAD_SIZE, HEAD_SIZE);
    if (!context || typeof createImageBitmap !== "function") return;
    const headContext = context;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    const bitmaps = new Map<number, ImageBitmap>();
    const blobs = new Map<number, Blob>();
    const failures = new Map<number, number>();
    const controller = new AbortController();
    let current = 90;
    let target = current;
    let velocity = 0;
    let lastDirection = 1;
    let insideDeadzone = false;
    let disposed = false;
    let visible = false;
    let started = false;
    let videoReady = false;
    let headDrawn = false;
    let revealed = false;
    let revealedAt = 0;
    let idle = 0;
    let timeout = 0;
    let frame = 0;
    let lastTime = 0;
    let lastPose = -1;
    let displayedTile: number | null = null;
    let pendingTile: number | null = null;
    let demandTile: number | null = null;
    let prefetchQueue: number[] = [];
    let bounds = stage.getBoundingClientRect();
    let boundsDirty = false;

    const active = () =>
      !disposed && visible && !document.hidden && !motion.matches;
    const deltaToTarget = () => {
      const delta = wrap(target - current + 180) - 180;
      // Opposite directions are equally valid. Keep the established direction
      // in a narrow tie band rather than flipping on pointer rounding noise.
      if (Math.abs(delta) >= 179.75) {
        return lastDirection >= 0
          ? wrap(target - current)
          : -wrap(current - target);
      }
      return delta;
    };
    const neighborsOf = (tile: number) => [
      (tile + 1) % TILES,
      (tile + TILES - 1) % TILES,
    ];
    const stillUseful = (tile: number) => {
      const currentTile = displayedTile ?? tileFor(current);
      return (
        tile === demandTile ||
        tile === currentTile ||
        neighborsOf(currentTile).includes(tile)
      );
    };
    const syncPlayback = () => {
      if (disposed || !started || !revealed) return;
      if (!active()) video.pause();
      else
        void video.play().catch(() => {
          // Keep the decoded first frame if native autoplay is blocked.
        });
    };
    const requestGlance = () => {
      if (frame || !started || !active()) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    };
    const queueNeighbors = () => {
      if (!active() || !headDrawn) return;
      const currentTile = displayedTile ?? tileFor(current);
      const direction = Math.sign(deltaToTarget()) || lastDirection;
      const forward = (currentTile + (direction >= 0 ? 1 : TILES - 1)) % TILES;
      const backward = (currentTile + (direction >= 0 ? TILES - 1 : 1)) % TILES;
      // Rebuild from the current pose, so obsolete prefetches cannot keep
      // replacing useful neighbors after a reversal or a tile change.
      prefetchQueue = [forward, backward].filter(
        (tile) =>
          !bitmaps.has(tile) && tile !== pendingTile && tile !== demandTile,
      );
      pumpTiles();
    };
    const reveal = () => {
      if (!videoReady || !headDrawn || revealed || !active()) return;
      revealed = true;
      revealedAt = performance.now();
      video.style.opacity = "1";
      headCanvas.style.opacity = "1";
      if (posterRef.current) posterRef.current.style.opacity = "0";
      syncPlayback();
      queueNeighbors();
      requestGlance();
    };

    function pumpTiles() {
      if (!started || !active() || pendingTile !== null) return;
      let tile: number | undefined;
      if (demandTile !== null && !bitmaps.has(demandTile)) {
        tile = demandTile;
        const failedAt = failures.get(tile);
        // A failed demand keeps its current photograph. Never spend its retry
        // cooldown decoding prefetches that cannot unlock the missing pose.
        if (failedAt !== undefined && performance.now() - failedAt < 10000)
          return;
      } else {
        if (demandTile !== null) demandTile = null;
        while (prefetchQueue.length) {
          const candidate = prefetchQueue.shift()!;
          const failedAt = failures.get(candidate);
          if (
            !bitmaps.has(candidate) &&
            stillUseful(candidate) &&
            (failedAt === undefined || performance.now() - failedAt >= 10000)
          ) {
            tile = candidate;
            break;
          }
        }
      }
      if (tile === undefined) return;
      const loadingTile = tile;
      pendingTile = loadingTile;
      let decoded = false;
      void (async () => {
        let blob = blobs.get(loadingTile);
        if (!blob) {
          const response = await fetch(`/robot/head-v8-t${loadingTile}.webp`, {
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(`Robot head request: ${response.status}`);
          blob = await response.blob();
          if (disposed) return;
        }
        blobs.delete(loadingTile);
        blobs.set(loadingTile, blob);
        while (blobs.size > COMPRESSED_CACHE_TILES) {
          blobs.delete(blobs.keys().next().value!);
        }
        // Retain compressed obsolete requests, but don't decode a tile whose
        // direction became irrelevant while it was in flight.
        if (!active() || !stillUseful(loadingTile)) return;
        // Three cached decoded strips occupy at most 25.3 MiB. The strip that
        // supplied the visible photograph remains resident during replacement.
        while (bitmaps.size >= DECODED_CACHE_TILES) {
          const keys = [...bitmaps.keys()];
          const currentTile = displayedTile ?? tileFor(current);
          const neighbors = neighborsOf(currentTile);
          const oldest =
            keys.find(
              (key) => key !== displayedTile && !neighbors.includes(key),
            ) ?? keys.find((key) => key !== displayedTile)!;
          bitmaps.get(oldest)?.close();
          bitmaps.delete(oldest);
        }
        const bitmap = await createImageBitmap(blob);
        if (disposed || !active() || !stillUseful(loadingTile)) {
          bitmap.close();
          return;
        }
        bitmaps.set(loadingTile, bitmap);
        decoded = true;
        failures.delete(loadingTile);
      })()
        .catch(() => {
          if (!disposed) failures.set(loadingTile, performance.now());
        })
        .finally(() => {
          pendingTile = null;
          if (!active()) return;
          if (decoded && (!headDrawn || demandTile === loadingTile)) {
            // Resuming after decoding starts a fresh clock, so an unavailable
            // photograph never creates an accumulated catch-up step.
            requestGlance();
          }
          pumpTiles();
        });
    }
    const demand = (tile: number) => {
      demandTile = tile;
      pumpTiles();
    };

    function animate(time: number) {
      frame = 0;
      if (!active()) return;
      const elapsed = Math.max(0, Math.min(32, time - lastTime));
      lastTime = time;
      const delta = deltaToTarget();
      const settling = Math.abs(delta) < 0.05 && Math.abs(velocity) < 0.5;
      const seconds = elapsed / 1000;
      const frequency = time - revealedAt < 1500 ? 8 : 14;
      // A critically damped response supplies a desired velocity. Carrying the
      // previous velocity through a reversal prevents an instant direction flip.
      let desiredVelocity =
        (velocity + frequency * (frequency * delta - velocity) * seconds) *
        Math.exp(-frequency * seconds);
      if (desiredVelocity * delta > 0) {
        const brakingSpeed = Math.sqrt(2 * MAX_ACCELERATION * Math.abs(delta));
        desiredVelocity =
          Math.sign(desiredVelocity) *
          Math.min(Math.abs(desiredVelocity), brakingSpeed);
      }
      const maximumVelocityChange = MAX_ACCELERATION * seconds;
      let nextVelocity = Math.max(
        -MAX_SPEED,
        Math.min(
          MAX_SPEED,
          velocity +
            Math.max(
              -maximumVelocityChange,
              Math.min(maximumVelocityChange, desiredVelocity - velocity),
            ),
        ),
      );
      let step = ((velocity + nextVelocity) * seconds) / 2;
      let next = wrap(current + step);
      if (!revealed) {
        next = current;
        nextVelocity = 0;
        step = 0;
      } else if (
        settling ||
        (step * delta > 0 && Math.abs(step) >= Math.abs(delta))
      ) {
        // A pointer can move its goal inside the current braking distance. Hold
        // that goal instead of crossing it, even if this requires a final clamp.
        next = target;
        nextVelocity = 0;
        step = delta;
      }
      const pose = wrap(Math.round(next));
      const index = atlasIndex(pose);
      const tile = Math.floor(index / TILE_COLUMNS);
      const bitmap = bitmaps.get(tile);
      if (!bitmap) {
        // Preserve the existing photograph and phase until the exact next pose
        // is available. Demand cannot be superseded by neighboring prefetches.
        velocity = 0;
        demand(tile);
        return;
      }
      current = next;
      velocity = nextVelocity;
      if (revealed && Math.abs(step) > 0.00001) lastDirection = Math.sign(step);
      if (demandTile === tile) demandTile = null;
      if (pose !== lastPose) {
        headContext.clearRect(0, 0, HEAD_SIZE, HEAD_SIZE);
        headContext.drawImage(
          bitmap,
          (index % TILE_COLUMNS) * HEAD_SIZE,
          0,
          HEAD_SIZE,
          HEAD_SIZE,
          0,
          0,
          HEAD_SIZE,
          HEAD_SIZE,
        );
        bitmaps.delete(tile);
        bitmaps.set(tile, bitmap);
        displayedTile = tile;
        lastPose = pose;
        headDrawn = true;
        reveal();
      }
      queueNeighbors();
      if (
        revealed &&
        (Math.abs(deltaToTarget()) >= 0.05 || Math.abs(velocity) >= 0.5) &&
        !frame
      ) {
        frame = requestAnimationFrame(animate);
      }
    }

    const start = () => {
      idle = 0;
      timeout = 0;
      if (started || !active()) return;
      started = true;
      video.preload = "auto";
      video.src = LOOP;
      video.load();
      demand(tileFor(current));
    };
    const scheduleStart = () => {
      if (started || idle || timeout || !active()) return;
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(start, { timeout: 250 });
      } else timeout = window.setTimeout(start, 0);
    };
    const stopHead = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      demandTile = null;
      prefetchQueue = [];
      target = current;
      velocity = 0;
    };
    const onVideoReady = () => {
      videoReady = true;
      reveal();
    };
    const onVideoError = () => {
      videoReady = false;
      revealed = false;
      stopHead();
      video.style.opacity = "0";
      headCanvas.style.opacity = "0";
      if (posterRef.current) posterRef.current.style.opacity = "1";
    };
    const onStateChange = () => {
      if (!active()) stopHead();
      if (started) {
        const wasRevealed = revealed;
        reveal();
        if (wasRevealed) syncPlayback();
        if (!headDrawn) requestGlance();
        else if (active()) queueNeighbors();
      } else scheduleStart();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!active() || !pointer.matches || event.pointerType === "touch")
        return;
      if (boundsDirty) {
        bounds = stage.getBoundingClientRect();
        boundsDirty = false;
      }
      const dx = event.clientX - bounds.left - bounds.width / 2;
      const dy = event.clientY - bounds.top - (bounds.width * 150) / WIDTH;
      const radius = Math.hypot(dx, dy);
      if (
        radius < DEADZONE_ENTER ||
        (insideDeadzone && radius <= DEADZONE_EXIT)
      ) {
        insideDeadzone = true;
        stopHead();
        return;
      }
      insideDeadzone = false;
      target = wrap((Math.atan2(dy, dx) * 180) / Math.PI);
      queueNeighbors();
      requestGlance();
    };
    const measure = () => {
      boundsDirty = true;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      onStateChange();
    });
    observer.observe(stage);
    video.addEventListener("loadeddata", onVideoReady);
    video.addEventListener("error", onVideoError);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    document.addEventListener("visibilitychange", onStateChange);
    motion.addEventListener("change", onStateChange);
    scheduleStart();

    return () => {
      disposed = true;
      stopHead();
      controller.abort();
      if (idle) window.cancelIdleCallback(idle);
      if (timeout) window.clearTimeout(timeout);
      observer.disconnect();
      video.removeEventListener("loadeddata", onVideoReady);
      video.removeEventListener("error", onVideoError);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", onStateChange);
      motion.removeEventListener("change", onStateChange);
      bitmaps.forEach((bitmap) => bitmap.close());
      bitmaps.clear();
      blobs.clear();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      data-robot-visual
      role="img"
      aria-label="Робот Автопилота: спокойная анимация рук, голова следует за курсором"
      className="relative mx-auto aspect-[1024/715] w-full max-w-[740px] -translate-y-4 origin-center sm:scale-[1.1] lg:ml-auto lg:scale-[1.18]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={posterRef}
        src={POSTER}
        alt=""
        width={WIDTH}
        height={HEIGHT}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full select-none object-contain"
      />
      <video
        ref={videoRef}
        width={WIDTH}
        height={HEIGHT}
        muted
        playsInline
        loop
        preload="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-contain opacity-0"
      />
      <canvas
        ref={headRef}
        width={HEAD_SIZE}
        height={HEAD_SIZE}
        aria-hidden="true"
        className="pointer-events-none absolute left-[31.25%] top-0 aspect-square w-[37.5%] opacity-0"
      />
    </div>
  );
}
