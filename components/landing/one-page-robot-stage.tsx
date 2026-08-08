"use client";

import { useEffect, useState } from "react";

import { SplineScene } from "@/components/ui/splite";

const sceneUrl = "/spline/friendly-robot.splinecode";

export function OnePageRobotStage() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    const sync = () => {
      setReduceMotion(motion.matches);
      setFinePointer(pointer.matches);
    };

    sync();
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
    };
  }, []);

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
