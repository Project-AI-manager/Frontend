import type { ReactNode } from "react";

import { Brand } from "@/components/ui/brand";

export function AuthShell({ children, width = 440 }: { children: ReactNode; width?: number }) {
  return (
    <main className="ap-doodle relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="relative flex w-full flex-col items-center gap-6" style={{ maxWidth: width }}>
        <Brand />
        {children}
      </div>
    </main>
  );
}
