import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("landing motion", () => {
  const source = readFileSync(path.join(process.cwd(), "autopilot-one-page.html"), "utf8");

  it("keeps the sticky header dimensions stable while scrolling", () => {
    const scrolledRule = source.match(/\.topbar\.scrolled \.topbar-inner\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(scrolledRule).not.toMatch(/\bwidth\s*:/);
    expect(scrolledRule).not.toMatch(/\btransform\s*:/);
  });

  it("does not tilt the hero console or run infinite hero pulses", () => {
    const productFrame = source.match(/\.product-frame\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(productFrame).toContain("transform: none");
    expect(source).not.toContain("productFrame.addEventListener(\"pointermove\"");
    expect(source.match(/\.status-dot::after\s*\{([^}]*)\}/)?.[1]).toContain("animation: none");
    expect(source.match(/\.signal\s*\{([^}]*)\}/)?.[1]).toContain("animation: none");
  });
});
