import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";

describe("AppShell", () => {
  it("keeps semantic cabinet navigation and page structure", () => {
    render(<AppShell title="База знаний" description="Документы компании"><p>Содержимое страницы</p></AppShell>);
    expect(screen.getByRole("navigation", { name: "Кабинет" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "База знаний" })).toHaveAttribute("href", "/knowledge");
    expect(screen.getByRole("link", { name: "Диалоги" })).toHaveAttribute("href", "/inbox");
    expect(screen.getByRole("link", { name: "Настройки" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "Профиль" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("heading", { name: "База знаний" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Содержимое страницы");
    expect(screen.queryByLabelText("Автопилот — диалоги")).not.toBeInTheDocument();
  });

  it("can hide the page topbar without removing the main content", () => {
    render(<AppShell title="Диалоги" description="Все обращения" showTopbar={false}><p>Список диалогов</p></AppShell>);
    expect(screen.queryByRole("heading", { name: "Диалоги" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Статус AI: на линии")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Список диалогов");
  });

  it("does not expose mock account labels", () => {
    render(<AppShell title="Аналитика" description="Метрики"><p>Содержимое</p></AppShell>);
    expect(screen.queryByText(/Demo Owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock режим/i)).not.toBeInTheDocument();
  });
});

describe("StateCard", () => {
  it("renders a neutral state", () => {
    render(<StateCard icon={<span data-testid="icon" />} title="Loading" description="Please wait" />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });
});

describe("InfoRow", () => {
  it("renders labels and values", () => {
    render(<InfoRow label="Tenant" value="alpha" />);
    expect(screen.getByText("Tenant")).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });
});
