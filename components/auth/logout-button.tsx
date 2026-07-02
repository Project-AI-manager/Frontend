"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import { clearAuthTokens, getRefreshToken } from "@/lib/api/token";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiClient<{ revoked: boolean }>({
          url: "/api/v1/auth/logout",
          method: "POST",
          data: { refresh_token: refreshToken },
        });
      }
    } catch {
      // Local cleanup must still happen if the network or backend is unavailable.
    } finally {
      clearAuthTokens();
      queryClient.clear();
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100"
      aria-label="Выйти из аккаунта"
    >
      <LogOut size={16} />
      <span>Выйти из аккаунта</span>
    </button>
  );
}
