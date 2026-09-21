"use client";

import { useEffect, useState } from "react";

import { SplineScene } from "@/components/ui/splite";

const sceneUrl = "/spline/friendly-robot.splinecode";

export function OnePageRobotStage() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(true);
  const [smallScreen, setSmallScreen] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    const mobile = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setReduceMotion(motion.matches);
      setFinePointer(pointer.matches);
      setSmallScreen(mobile.matches);
    };

    sync();
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    mobile.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
      mobile.removeEventListener("change", sync);
    };
  }, []);

  if (smallScreen || !finePointer) {
    return (
      <div className="one-page-robot-stage one-page-robot-stage--static" aria-label="AI-сотрудник Автопилота">
        <div className="one-page-robot-static">
          <div className="one-page-robot-static-orb" />
          <div className="one-page-robot-static-panel">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="one-page-robot-stage" aria-label="Интерактивный AI-сотрудник Автопилота">
      <div className="one-page-robot-crop">
        <div className="one-page-robot-canvas">
          <SplineScene
            scene={sceneUrl}
            className="size-full"
            globalEvents={!reduceMotion && finePointer}
            paused={reduceMotion}
          />
        </div>
      </div>
    </div>
  );
}
