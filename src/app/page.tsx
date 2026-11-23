import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

const workspaceDetails = [
  { label: "Pengguna", value: "Suami & istri" },
  { label: "Mata uang utama", value: "Rupiah (IDR)" },
  { label: "Zona waktu", value: "Asia/Jakarta" },
  { label: "Penyimpanan data", value: "Supabase pribadi" }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,_rgba(20,36,58,0.08),_transparent_68%)]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between border-b border-border/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-semibold tracking-tight text-primary-foreground shadow-sm">
              F
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-foreground">
                FINANCIA
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.16em] text-muted-foreground">
                PRIVATE FAMILY FINANCE
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Foundation aktif
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Ruang keuangan keluarga yang privat
            </div>

            <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
              Keuangan keluarga,
              <span className="block text-[#64748b]">
                dalam satu kendali.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Satu tempat untuk mengelola rekening, pemasukan, pengeluaran,
              tabungan, aset, dan bisnis keluarga dengan pencatatan yang jelas.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Masuk ke FINANCIA
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <span className="text-xs text-muted-foreground">
                Workspace pribadi untuk dua pengguna
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_60px_-40px_rgba(20,36,58,0.3)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                  KONFIGURASI WORKSPACE
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  FINANCIA siap dibangun
                </h2>
              </div>
              <div className="rounded-xl bg-[#edf1f5] p-3 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
            </div>

            <dl className="mt-7 divide-y divide-border">
              {workspaceDetails.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <dt className="text-sm text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-right text-sm font-medium text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 rounded-xl bg-[#f4f6f8] p-4">
              <p className="text-xs font-semibold text-foreground">
                Tahap saat ini
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Project foundation dan konfigurasi aplikasi.
              </p>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border/80 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>FINANCIA · Your Family Finance & Wealth Management</span>
          <span>Privat · IDR · Asia/Jakarta</span>
        </footer>
      </div>
    </main>
  );
}
