import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "@/components/auth/logout-button";
import { apiClient } from "@/lib/api/client";
import { getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/api/token";

const replace = vi.fn();
const refresh = vi.fn();
const mockedApiClient = vi.mocked(apiClient);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
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
    mockedApiClient.mockReset();
    mockedApiClient.mockResolvedValue({ revoked: true });
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("revokes refresh token, clears auth state, query cache and redirects to login", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["profile"], { name: "Demo" });
    setAuthTokens({ accessToken: "access-token", refreshToken: "refresh-token" });

    renderLogoutButton(queryClient);

    await userEvent.click(screen.getByRole("button"));

    expect(mockedApiClient).toHaveBeenCalledWith({
      url: "/api/v1/auth/logout",
      method: "POST",
      data: { refresh_token: "refresh-token" },
    });
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });

  it("still clears local session when backend logout fails", async () => {
    mockedApiClient.mockRejectedValueOnce(new Error("network unavailable"));
    setAuthTokens({ accessToken: "access-token", refreshToken: "refresh-token" });

    renderLogoutButton();

    await userEvent.click(screen.getByRole("button"));

    expect(mockedApiClient).toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
