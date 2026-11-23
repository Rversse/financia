"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Forward Supabase invite payloads that land on the Site URL root. */
export function AuthRedirectHandler() {
  const router = useRouter();
  useEffect(() => {
    const search = window.location.search;
    const hash = window.location.hash;
    const query = new URLSearchParams(search);
    const fragment = new URLSearchParams(hash.replace(/^#/, ""));
    const hasAuthPayload = query.has("code") || query.has("token_hash") || fragment.has("access_token") || fragment.has("error") || fragment.has("error_description");
    if (hasAuthPayload) router.replace("/auth/callback" + search + hash);
  }, [router]);
  return null;
}
