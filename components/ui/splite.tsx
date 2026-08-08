"use client";

import type { Application } from "@splinetool/runtime";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SplineSceneProps {
  scene: string;
  className?: string;
  globalEvents?: boolean;
  paused?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const noop = () => undefined;

export function SplineScene({
  scene,
  className,
  globalEvents = false,
  paused = false,
  onLoad = noop,
  onError = noop,
}: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const globalEventsRef = useRef(globalEvents);
  const pausedRef = useRef(paused);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let app: Application | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let cancelled = false;

    void import("@splinetool/runtime")
      .then(async ({ Application }) => {
        if (cancelled) return;
        app = new Application(canvas, { renderMode: "auto" });
        appRef.current = app;
        await app.load(scene);
        if (cancelled) {
          app.dispose();
          return;
        }
        app.setBackgroundColor("transparent");
        app.setGlobalEvents(globalEventsRef.current);
        if (pausedRef.current) app.stop();
        const syncSceneSize = () => {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (!width || !height) return;
          const quality = matchMedia("(max-width: 767px), (pointer: coarse)").matches ? 0.82 : 0.94;
          app?.setSize(Math.ceil(width * quality), Math.ceil(height * quality));
        };
        syncSceneSize();
        resizeObserver = new ResizeObserver(syncSceneSize);
        resizeObserver.observe(canvas);
        setLoaded(true);
        onLoad?.();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Spline scene failed to load", error);
        setFailed(true);
        onError?.();
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      app?.dispose();
      if (appRef.current === app) appRef.current = null;
    };
  }, [onError, onLoad, scene]);

  useEffect(() => {
    globalEventsRef.current = globalEvents;
    pausedRef.current = paused;
    const app = appRef.current;
    if (!app || !loaded) return;
    app.setGlobalEvents(globalEvents);
    if (paused) app.stop();
    else app.play();
  }, [globalEvents, loaded, paused]);

  useEffect(() => {
    if (!loaded) return;
    const syncVisibility = () => {
      const app = appRef.current;
      if (!app) return;
      if (document.hidden || pausedRef.current) app.stop();
      else app.play();
    };
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, [loaded]);

  return (
    <div className={cn("relative size-full", className)}>
      {!loaded ? (
        <div className="absolute inset-0" role="status" aria-label={failed ? "Не удалось загрузить 3D-робота" : "Загрузка 3D-робота"}>
          <span className="sr-only">{failed ? "Не удалось загрузить 3D-робота" : "Загрузка 3D-робота"}</span>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("block size-full transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
