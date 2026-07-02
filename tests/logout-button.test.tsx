import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "@/components/auth/logout-button";
import { getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/api/token";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

function renderLogoutButton(queryClient = new QueryClient()) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <LogoutButton />
      </QueryClientProvider>,
    ),
  };
}

describe("LogoutButton", () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("clears auth state, query cache and redirects to login", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["profile"], { name: "Demo" });
    setAuthTokens({ accessToken: "access-token", refreshToken: "refresh-token" });

    renderLogoutButton(queryClient);

    await userEvent.click(screen.getByRole("button", { name: /выйти/i }));

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });
});
