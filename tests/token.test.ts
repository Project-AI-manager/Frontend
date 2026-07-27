import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/api/token";

describe("auth token storage", () => {
  beforeEach(() => {
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("stores access and refresh tokens", () => {
    setAuthTokens({ accessToken: "access-token", refreshToken: "refresh-token" });

    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(document.cookie).toContain("refresh_token=refresh-token");
  });

  it("clears local storage and refresh cookie", () => {
    setAuthTokens({ accessToken: "access-token", refreshToken: "refresh-token" });

    clearAuthTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(document.cookie).not.toContain("refresh_token=");
  });
});
