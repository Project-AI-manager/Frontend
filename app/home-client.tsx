"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

/**
 * 3D-сцена героя. Грузится только на клиенте (ssr: false), поэтому объявлена
 * здесь, в клиентском модуле: в серверном компоненте next/dynamic со ssr: false
 * не разрешён. Контракт компонента не меняется —
 * components/landing/autopilot-scene.tsx экспортирует AutopilotScene({ className }).
 */
export const AutopilotScene = dynamic(
  () =>
    import("@/components/landing/autopilot-scene").then((m) => m.AutopilotScene),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

/**
 * Плавное появление секций лендинга: каждому элементу с [data-reveal]
 * добавляем .is-visible, когда он входит в область просмотра.
 * Работает и для .reveal-block, и для .reveal-stagger.
 */
export function HomeClient() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (nodes.length === 0) {
      return;
    }

    const reveal = (node: HTMLElement) => node.classList.add("is-visible");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      // threshold 0 + отрицательный нижний отступ: высокие секции появляются
      // надёжно, а короткие — чуть раньше, чем упрутся в низ экрана.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );

    nodes.forEach((node) => {
      if (node.classList.contains("is-visible")) {
        return;
      }

      // Страховка: то, что уже в кадре на момент монтирования, показываем сразу,
      // не дожидаясь первого колбэка наблюдателя.
      if (node.getBoundingClientRect().top < window.innerHeight * 0.88) {
        reveal(node);
        return;
      }

      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
