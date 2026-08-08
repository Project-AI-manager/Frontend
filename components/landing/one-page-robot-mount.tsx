"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { OnePageRobotStage } from "@/components/landing/one-page-robot-stage";

export function OnePageRobotMount() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMountNode(document.querySelector<HTMLElement>("[data-robot-canvas-slot]"));
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return mountNode ? createPortal(<OnePageRobotStage />, mountNode) : null;
}
