"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ProductTour } from "@/components/onboarding/product-tour";

// Серверное состояние (TanStack Query) поверх Axios-клиента.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      <ProductTour />
    </QueryClientProvider>
  );
}
