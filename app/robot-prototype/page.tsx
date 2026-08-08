import type { Metadata } from "next";

import { InteractiveRobotHero } from "@/components/landing/interactive-robot-hero";

export const metadata: Metadata = {
  title: "Интерактивный AI-сотрудник",
  description: "Прототип интерактивного лендинга Автопилота с добрым 3D-роботом.",
  robots: { index: false, follow: false },
};

export default function RobotPrototypePage() {
  return (
    <>
      <link rel="preload" href="/spline/friendly-robot.splinecode" as="fetch" crossOrigin="anonymous" />
      <InteractiveRobotHero />
    </>
  );
}
