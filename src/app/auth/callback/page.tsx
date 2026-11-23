"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const allowedOtpTypes: EmailOtpType[] = ["invite", "recovery", "signup", "email", "email_change", "magiclink"];

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Memverifikasi undangan atau tautan autentikasi…");

  useEffect(() => {
    let active = true;
    async function completeAuthentication() {
      try {
        const supabase = getSupabaseBrowserClient();
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type") ?? hashParams.get("type");
        const authError = params.get("error_description") ?? hashParams.get("error_description") ?? params.get("error") ?? hashParams.get("error");
        if (authError) throw new Error(authError.replaceAll("+", " "));
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type && allowedOtpTypes.includes(type as EmailOtpType)) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
          if (error) throw error;
        }
        // Implicit-flow invitation links deliver access_token in the URL hash.
        // The browser client detects and persists this session during initialization.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("Sesi tidak ditemukan. Tautan mungkin sudah kedaluwarsa; minta undangan baru.");
        if (active) {
          if (type === "recovery") {
            setMessage("Identitas terverifikasi. Membuka pengaturan password…");
            router.replace("/reset-password");
          } else {
            setMessage("Autentikasi berhasil. Membuka workspace…");
            router.replace("/dashboard");
          }
        }
      } catch (cause) {
        if (active) setMessage(cause instanceof Error ? cause.message : "Tautan autentikasi tidak dapat diverifikasi.");
      }
    }
    void completeAuthentication();
    return () => { active = false; };
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">F</div><h1 className="mt-5 text-lg font-semibold text-foreground">FINANCIA authentication</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p><a href="/login" className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">Kembali ke halaman masuk</a></section></main>;
}
