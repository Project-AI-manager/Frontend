const ACCESS_TOKEN_KEY = "ai_manager_access_token";
const REFRESH_TOKEN_KEY = "ai_manager_refresh_token";
const REFRESH_COOKIE_KEY = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export function getAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);

  if (tokens.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    document.cookie = `${REFRESH_COOKIE_KEY}=${encodeURIComponent(tokens.refreshToken)}; path=/; max-age=${REFRESH_COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

export function clearAuthTokens() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${REFRESH_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
