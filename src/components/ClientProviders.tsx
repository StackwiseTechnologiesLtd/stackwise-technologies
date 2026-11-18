"use client";

import { NavigationProgress } from "@/components/NavigationProgress";
import { ToastProvider } from "@/components/ToastProvider";
import type { ReactNode } from "react";
import { Suspense } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </ToastProvider>
  );
}
