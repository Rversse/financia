"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) throw signInError;
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Email atau password tidak dapat diverifikasi."
      );
      setPending(false);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setError("Masukkan alamat email terlebih dahulu.");
      return;
    }

    setResetPending(true);
    setError(null);
    setResetMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${siteUrl}/auth/callback` }
      );

      if (resetError) throw resetError;

      setResetMessage(
        "Jika alamat tersebut terdaftar, instruksi pemulihan akan dikirim melalui email."
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Permintaan pemulihan password tidak dapat diproses."
      );
    } finally {
      setResetPending(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
      <section className="hidden flex-col justify-between bg-primary px-12 py-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/20 text-lg font-semibold">
            F
          </div>
          <span className="text-sm font-semibold tracking-[0.18em]">FINANCIA</span>
        </Link>

        <div className="max-w-xl pb-12">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/60">
            PRIVATE FAMILY FINANCE
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Satu ruang untuk keuangan keluarga.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">
            Kelola rekening, arus kas, tabungan, aset, kewajiban, dan bisnis
            keluarga dengan pencatatan yang terstruktur.
          </p>
        </div>

        <p className="text-xs text-white/50">
          Akses hanya untuk anggota keluarga yang diundang.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke FINANCIA
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border bg-card text-primary">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Masuk ke FINANCIA
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan akun email yang sudah diundang ke workspace keluarga.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="nama@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="Masukkan password"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetPending}
                className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                {resetPending ? "Mengirim…" : "Lupa password?"}
              </button>
            </div>

            {resetMessage && (
              <p role="status" className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                {resetMessage}
              </p>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <Button className="w-full" size="lg" type="submit" disabled={pending}>
              {pending ? "Memverifikasi…" : "Masuk"}
            </Button>
          </form>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-5 text-muted-foreground">
              Registrasi publik tidak tersedia. Kedua akun keluarga harus
              diprovisioning melalui undangan administrator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
