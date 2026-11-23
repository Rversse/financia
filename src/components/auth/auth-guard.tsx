"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" && !session && active) {
          setReady(false);
          router.replace("/login");
        }
      });

      void supabase.auth.getUser().then(({ data, error }) => {
        if (!active) return;

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setReady(true);
      }).catch((error: unknown) => {
        if (!active) return;
        setConfigurationError(
          error instanceof Error ? error.message : "Autentikasi tidak dapat diverifikasi."
        );
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      setConfigurationError(
        error instanceof Error ? error.message : "Konfigurasi Supabase belum tersedia."
      );
      return () => {
        active = false;
      };
    }
  }, [router]);

  if (configurationError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-border bg-card p-7">
          <h1 className="text-lg font-semibold text-foreground">
            Konfigurasi autentikasi belum lengkap
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {configurationError}
          </p>
        </section>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Memeriksa sesi FINANCIA…</p>
      </main>
    );
  }

  return <>{children}</>;
}
