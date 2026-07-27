"use client";

import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import { clearAuthTokens, getRefreshToken } from "@/lib/api/token";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient({
          url: "/api/v1/auth/logout",
          method: "POST",
          data: { refresh_token: refreshToken },
        });
      }
    } catch {
      // Локальную сессию закрываем даже при недоступном API.
    } finally {
      clearAuthTokens();
      queryClient.clear();
      router.replace("/login");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={pending} className={className}>
      <LogOut size={17} aria-hidden="true" />
      {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}
