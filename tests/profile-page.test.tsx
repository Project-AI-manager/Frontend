import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/profile/page";

const usersApi = vi.hoisted(() => ({ meApiV1UsersMeGet: vi.fn() }));
const notificationsApi = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
const shell = vi.hoisted(() => ({ props: null as null | Record<string, unknown> }));

vi.mock("@/lib/api/generated/users/users", () => ({ getUsers: () => usersApi }));
vi.mock("@/lib/api/notifications", () => ({ notificationsApi }));
vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
    shell.props = props;
    return <>{children}</>;
  },
}));
vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: ({ className }: { className?: string }) => <button className={className}>Выйти</button>,
}));

const user = {
  id: "user-1",
  tenant_id: "tenant-1",
  email: "timur@example.com",
  full_name: "Тимур Ахметов",
  role: "owner",
  status: "active",
  email_verified: true,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ProfilePage /></QueryClientProvider>);
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shell.props = null;
    usersApi.meApiV1UsersMeGet.mockResolvedValue(user);
    notificationsApi.get.mockResolvedValue({
      escalation_email_enabled: true,
      daily_digest_email_enabled: false,
    });
    notificationsApi.update.mockImplementation(async (data) => ({
      escalation_email_enabled: data.escalation_email_enabled ?? true,
      daily_digest_email_enabled: data.daily_digest_email_enabled ?? false,
    }));
  });

  it("shows only real personal data, notifications and logout on the immersive background", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Тимур Ахметов", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("timur@example.com").length).toBeGreaterThan(0);
    expect(shell.props).toEqual(expect.objectContaining({ immersive: true }));
    expect(screen.getByRole("heading", { name: "Уведомления" })).toBeInTheDocument();
    expect(await screen.findByRole("switch", { name: "Присылать на почту, когда нужен человек" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Сводка за день на почту" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
    expect(screen.queryByText("Компания")).not.toBeInTheDocument();
    expect(screen.queryByText("Телефон")).not.toBeInTheDocument();
    expect(screen.queryByText("Фамилия")).not.toBeInTheDocument();
    expect(screen.queryByText("Последний вход")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
  });

  it("persists email notification preferences", async () => {
    renderPage();
    const escalationEmail = await screen.findByRole("switch", { name: "Присылать на почту, когда нужен человек" });
    await waitFor(() => expect(escalationEmail).not.toBeDisabled());
    expect(escalationEmail).toHaveAttribute("aria-checked", "true");
    fireEvent.click(escalationEmail);
    await waitFor(() => expect(notificationsApi.update).toHaveBeenCalled());
    expect(notificationsApi.update.mock.calls[0][0]).toEqual({ escalation_email_enabled: false });
    await waitFor(() => expect(escalationEmail).toHaveAttribute("aria-checked", "false"));
  });

  it("retries the user request from the error state", async () => {
    usersApi.meApiV1UsersMeGet.mockRejectedValueOnce(new Error("Ошибка сети")).mockResolvedValueOnce(user);
    renderPage();

    expect(await screen.findByText("Профиль не загрузился")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    await waitFor(() => expect(usersApi.meApiV1UsersMeGet).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Тимур Ахметов", level: 1 })).toBeInTheDocument();
  });
});
