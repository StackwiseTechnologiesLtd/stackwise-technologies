"use client";

import { createContext, useContext } from "react";
import type { BrandAssetStorage } from "@/lib/branding/types";

const BrandAssetStorageContext = createContext<BrandAssetStorage>("code");

export function BrandAssetStorageProvider({
  storage,
  children,
}: {
  storage: BrandAssetStorage;
  children: React.ReactNode;
}) {
  return (
    <BrandAssetStorageContext.Provider value={storage}>
      {children}
    </BrandAssetStorageContext.Provider>
  );
}

export function useBrandAssetStorage(): BrandAssetStorage {
  return useContext(BrandAssetStorageContext);
}
