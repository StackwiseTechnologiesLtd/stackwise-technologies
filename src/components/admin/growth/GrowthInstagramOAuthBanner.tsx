"use client";

import { useToast } from "@/components/ToastProvider";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GrowthInstagramOAuthBanner() {
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const ig = searchParams.get("ig");
    const err = searchParams.get("oauth_error");

    if (oauth === "ok") {
      toast.success(
        ig
          ? `Instagram connected (@${ig.replace(/^@/, "")})`
          : "Instagram account connected",
      );
      replaceUrlWithoutOAuthParams();
    } else if (err) {
      toast.error(decodeURIComponent(err));
      replaceUrlWithoutOAuthParams();
    }
  }, [searchParams, toast]);

  return null;
}

function replaceUrlWithoutOAuthParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth");
  url.searchParams.delete("ig");
  url.searchParams.delete("oauth_error");
  window.history.replaceState({}, "", url.pathname + url.search);
}