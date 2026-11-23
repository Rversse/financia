"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type HouseholdSummary = {
  id: string;
  name: string;
  base_currency: string;
  timezone: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [household, setHousehold] = useState<HouseholdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          router.replace("/login");
          return;
        }

        if (active) setEmail(userData.user.email ?? "");

        const { data, error: householdError } = await supabase
          .from("households")
          .select("id, name, base_currency, timezone")
          .maybeSingle();

        if (householdError) throw householdError;

        if (active) {
          setHousehold(data);
          setLoading(false);
        }
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Data workspace tidak dapat dimuat."
        );
        setLoading(false);
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;
      router.replace("/login");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Tidak dapat keluar dari sesi."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-7 sm:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
              F
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-foreground">
                FINANCIA
              </p>
              <p className="mt-0.5 text-[10px] tracking-[0.14em] text-muted-foreground">
                PRIVATE FAMILY FINANCE
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut aria-hidden="true" />
            Keluar
          </Button>
        </header>

        <section className="flex-1 py-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Workspace keluarga</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-700" aria-hidden="true" />
              Sesi terautentikasi
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-card p-7 sm:p-9">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Memuat data household…
              </p>
            ) : household ? (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                  HOUSEHOLD TERHUBUNG
                </p>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {household.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mata uang {household.base_currency} · Zona waktu {household.timezone}
                </p>
                <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Struktur database siap digunakan. Modul dashboard keuangan akan
                  diaktifkan setelah konfigurasi akun, household, dan pengujian akses
                  dua pengguna selesai.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                  AUTENTIKASI BERHASIL
                </p>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  Household belum diprovisioning
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Akun berhasil dikenali oleh Supabase Auth, tetapi belum terhubung
                  ke household FINANCIA. Akses data keuangan tetap tertutup sampai
                  dua anggota keluarga yang disetujui diprovisioning.
                </p>
              </>
            )}
          </div>
        </section>

        <footer className="border-t border-border py-5 text-xs text-muted-foreground">
          FINANCIA · Data keluarga bersifat privat · IDR · Asia/Jakarta
        </footer>
      </div>
    </main>
  );
}
