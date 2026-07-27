import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import type { TokenPair } from "./generated/ai.schemas";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./token";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
let refreshPromise: Promise<TokenPair> | null = null;

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isRefreshRequest = originalRequest?.url?.includes("/api/v1/auth/refresh");
    const isLoginRequest = originalRequest?.url?.includes("/api/v1/auth/login");
    const isRegisterRequest = originalRequest?.url?.includes("/api/v1/auth/register");
    const refreshToken = getRefreshToken();

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isLoginRequest || isRegisterRequest) {
      return Promise.reject(error);
    }

    if (!originalRequest || originalRequest._retry || isRefreshRequest || !refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await refreshAccessToken(refreshToken);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${tokens.access_token}`,
      };
      return axiosInstance.request(originalRequest);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

function clearSessionAndRedirect() {
  clearAuthTokens();

  if (
    typeof window !== "undefined" &&
    !["/login", "/register"].includes(window.location.pathname)
  ) {
    window.location.assign("/login");
  }
}

export async function apiClient<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<T>({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  });

  return response.data;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  refreshPromise ??= axios
    .request<TokenPair>({
      baseURL: apiBaseUrl,
      url: "/api/v1/auth/refresh",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        refresh_token: refreshToken,
      },
    })
    .then((response) => {
      setAuthTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      });
      return response.data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
