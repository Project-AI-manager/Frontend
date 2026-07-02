"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { clearAuthTokens } from "@/lib/api/token";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  function handleLogout() {
    clearAuthTokens();
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100"
      aria-label="Выйти из аккаунта"
    >
      <LogOut size={16} />
      <span>Выйти из аккаунта</span>
    </button>
  );
}
