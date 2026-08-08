import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PrivacyPage from "@/app/legal/privacy/page";

vi.mock("@/components/layout/header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("PrivacyPage", () => {
  it("publishes the supplied policy in a complete navigable layout", () => {
    const { container } = render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Политика в отношении обработки персональных данных",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ИП Закиров Т. А.").length).toBeGreaterThan(0);
    expect(screen.getByText(/Федеральный закон от 27\.07\.2006 № 152-ФЗ/)).toBeInTheDocument();
    const sections = [...container.querySelectorAll("article section[id]")];
    const tableOfContentsLinks = [
      ...screen.getByRole("navigation", { name: "Разделы политики" }).querySelectorAll("a[href^='#']"),
    ];

    expect(sections).toHaveLength(13);
    expect(tableOfContentsLinks).toHaveLength(sections.length);
    tableOfContentsLinks.forEach((link) => {
      const target = link.getAttribute("href");
      expect(target).toBeTruthy();
      expect(container.querySelector(target!)).toBeInTheDocument();
    });
    expect(screen.getByText("Содержание политики")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Реквизиты Оператора" })).toBeInTheDocument();
  });

  it("does not expose unresolved template placeholders as real requisites", () => {
    const { container } = render(<PrivacyPage />);

    expect(container).not.toHaveTextContent("[ИНН]");
    expect(container).not.toHaveTextContent("[номер]");
    expect(container).not.toHaveTextContent("[адрес]");
    expect(container).not.toHaveTextContent("[email]");
    expect(screen.getAllByText("Будет указан после регистрации ИП")).toHaveLength(3);
  });
});
