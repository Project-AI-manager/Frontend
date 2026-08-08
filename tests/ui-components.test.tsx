import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";

const navigationState = vi.hoisted(() => ({ pathname: "/inbox" }));
const conversationsApi = vi.hoisted(() => ({
  listConversationItemsApiV1ConversationsGet: vi.fn(),
}));
const usersApi = vi.hoisted(() => ({
  meApiV1UsersMeGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/api/generated/conversations/conversations", () => ({
  getConversations: () => conversationsApi,
}));
vi.mock("@/lib/api/generated/users/users", () => ({
  getUsers: () => usersApi,
}));

afterEach(() => {
  navigationState.pathname = "/inbox";
  localStorage.clear();
  conversationsApi.listConversationItemsApiV1ConversationsGet.mockReset();
  usersApi.meApiV1UsersMeGet.mockReset();
});

function renderShell(children: React.ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>,
  );
}

describe("AppShell", () => {
  it("renders semantic navigation and marks the current destination", () => {
    navigationState.pathname = "/knowledge/document";

    renderShell(
      <AppShell title="База знаний" description="Документы компании">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Основная навигация" }),
    ).toBeInTheDocument();
    const desktopNavigation = screen.getByRole("navigation", { name: "Основная навигация" });
    expect(within(desktopNavigation).getByRole("link", { name: "База знаний" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(within(desktopNavigation).getByRole("link", { name: "Каналы" })).toHaveAttribute(
      "href",
      "/channels",
    );
    expect(
      screen.getByRole("link", { name: "Перейти к содержимому" }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("renders a mobile brand header with Settings and Profile actions", () => {
    renderShell(
      <AppShell title="Диалоги" description="Входящие обращения">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Мобильная навигация" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Автопилот — на главную" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Настройки" }).some((link) => link.classList.contains("lg:hidden"))).toBe(true);
    expect(screen.getAllByRole("link", { name: "Профиль" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Ещё разделы" })).not.toBeInTheDocument();
  });

  it("keeps the primary mobile destinations visible and marks the active one", () => {
    navigationState.pathname = "/channels";

    renderShell(
      <AppShell title="Каналы" description="Каналы связи">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Мобильная навигация",
    });
    expect(within(mobileNavigation).getByRole("link", { name: "Диалоги" })).toHaveAttribute("href", "/inbox");
    expect(within(mobileNavigation).getByRole("link", { name: "Каналы" })).toHaveAttribute("aria-current", "page");
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(4);
  });

  it("does not expose mock account labels in the shared shell", () => {
    renderShell(
      <AppShell title="Аналитика" description="Метрики">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(screen.queryByText(/Demo Owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock режим/i)).not.toBeInTheDocument();
  });

  it("renders one stable background for immersive cabinet pages", () => {
    const { container } = renderShell(
      <AppShell title="Аналитика" description="Метрики" immersive>
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(main.querySelectorAll('[data-app-background="true"]')).toHaveLength(
      1,
    );
    expect(
      container.querySelectorAll('[data-app-background="true"]'),
    ).toHaveLength(1);
  });

  it("renders the shared background for standard cabinet pages", () => {
    const { container } = renderShell(
      <AppShell title="Начало работы" description="Настройка кабинета">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(main.querySelectorAll('[data-app-background="true"]')).toHaveLength(
      1,
    );
    expect(
      container.querySelectorAll('[data-app-background="true"]'),
    ).toHaveLength(1);
  });

  it("keeps logout out of both sidebar variants", () => {
    renderShell(
      <AppShell title="Диалоги" description="Входящие обращения">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(
      screen.queryByRole("button", { name: "Выйти" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Выйти" }),
    ).not.toBeInTheDocument();
  });

  it("renders the live unread total instead of a hardcoded badge", async () => {
    localStorage.setItem("ai_manager_access_token", "token");
    conversationsApi.listConversationItemsApiV1ConversationsGet.mockResolvedValue(
      [{ unread_count: 2 }, { unread_count: 5 }],
    );
    usersApi.meApiV1UsersMeGet.mockResolvedValue({
      email: "verified@example.com",
      email_verified: true,
    });

    renderShell(
      <AppShell title="Диалоги" description="Входящие обращения">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect((await screen.findAllByText("7")).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });
});

describe("StateCard", () => {
  it("renders a neutral start-aligned state with optional description", () => {
    render(
      <StateCard
        icon={<span data-testid="icon" />}
        title="Loading"
        description="Please wait"
      />,
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("renders centered error states", () => {
    render(
      <StateCard icon={<span />} title="Error" tone="error" align="center" />,
    );

    const card = screen.getByRole("alert");
    expect(card).toHaveClass("text-center");
    // В каркасе тон ошибки монохромный: оформление общее (.wf-fill),
    // а состояние читается по data-tone и роли alert.
    expect(card).toHaveClass("wf-fill");
    expect(card).toHaveAttribute("data-tone", "error");
    expect(card).toHaveAttribute("aria-live", "assertive");
  });
});

describe("InfoRow", () => {
  it("renders labels and values", () => {
    render(<InfoRow label="Tenant" value="alpha" />);

    expect(screen.getByText("Tenant")).toHaveClass("wf-muted");
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });

  it("supports inverted and truncated variants", () => {
    render(
      <InfoRow label="Tenant ID" value="very-long-id" inverted truncate />,
    );

    // Инвертированная поверхность в каркасе не отличается цветом: подпись
    // остаётся приглушённой, а сам prop виден через data-inverted.
    expect(screen.getByText("Tenant ID")).toHaveClass("wf-muted");
    expect(
      screen.getByText("Tenant ID").parentElement?.parentElement,
    ).toHaveAttribute("data-inverted", "true");
    expect(screen.getByText("very-long-id")).toHaveClass("truncate");
    expect(screen.getByText("very-long-id")).toHaveAttribute(
      "title",
      "very-long-id",
    );
  });
});
