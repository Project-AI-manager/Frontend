import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TermsPage from "@/app/legal/terms/page";

vi.mock("@/components/layout/header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("TermsPage", () => {
  it("renders every linked section in the unified legal layout", () => {
    const { container } = render(<TermsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Условия использования" })).toBeInTheDocument();
    expect(screen.getByText("Содержание условий")).toBeInTheDocument();

    const documentSections = [...container.querySelectorAll("article section[id]")];
    const desktopLinks = [
      ...screen.getByRole("navigation", { name: "Разделы условий" }).querySelectorAll("a[href^='#']"),
    ];

    expect(documentSections).toHaveLength(4);
    expect(desktopLinks).toHaveLength(documentSections.length);
    desktopLinks.forEach((link) => {
      const target = link.getAttribute("href");
      expect(target).toBeTruthy();
      expect(container.querySelector(target!)).toBeInTheDocument();
    });
  });
});
