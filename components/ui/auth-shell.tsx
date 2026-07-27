import type { ReactNode } from "react";

import { Brand } from "@/components/ui/brand";
import { AuthBackground } from "@/components/ui/auth-background";

export function AuthShell({ children, width = 440 }: { children: ReactNode; width?: number }) {
  return (
    <main className="ap-auth-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <AuthBackground />
      <div className={`relative z-10 flex w-full flex-col items-center ${width === 480 ? "gap-5" : "gap-6"}`} style={{ maxWidth: width }}>
        <Brand />
        {children}
      </div>
    </main>
  );
}
