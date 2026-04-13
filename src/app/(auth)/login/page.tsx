import Link from "next/link";
import {
  ChevronRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Droplets,
  ClipboardList,
  Users2,
} from "lucide-react";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#eef2f6] text-neutral-950">
      <style>{`
        @keyframes dotGlow {
          0%,
          100% {
            transform: scale(1);
            filter: brightness(1);
            opacity: 0.88;
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          35% {
            transform: scale(1.18);
            filter: brightness(1.18);
            opacity: 1;
            box-shadow:
              0 0 8px currentColor,
              0 0 16px currentColor;
          }
        }
      `}</style>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <aside className="hidden lg:block lg:min-h-screen">
          <OperationsShowcase />
        </aside>

        <main className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          <div className="absolute inset-0 lg:hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#f9fafb_0%,#eef2f6_50%,#e8edf4_100%)]" />
            <div className="absolute left-1/2 top-[-88px] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
          </div>

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute right-[12%] top-[14%] h-44 w-44 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="absolute bottom-[12%] right-[18%] h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute inset-[10%] rounded-[40px] border border-white/20" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
            <div className="mb-3 px-1 lg:hidden">
              <div className="flex w-full items-center rounded-[22px] border border-white/80 bg-white/75 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center text-[15px] font-semibold tracking-[-0.02em] text-neutral-900"
                >
                  <span className="mr-2 text-lg">🏠</span>
                  <span>EstateDesk</span>
                </Link>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/72 shadow-[0_30px_90px_rgba(15,23,42,0.16),0_10px_25px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl sm:rounded-[30px]">
              <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/40 sm:rounded-[30px]" />
              <div className="pointer-events-none absolute -inset-px rounded-[28px] [box-shadow:0_0_0_1px_rgba(255,255,255,0.18),0_0_25px_rgba(96,165,250,0.08),0_0_45px_rgba(255,255,255,0.12)] sm:rounded-[30px]" />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0))]" />
              <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 bottom-10 h-24 w-24 rounded-full bg-cyan-100/50 blur-2xl" />

              <div className="border-b border-neutral-100/80 px-5 pb-4 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
                <div className="mb-3 flex items-center gap-2">
                  {[
                    { color: "#ff5f57", delay: "0s" },
                    { color: "#febc2e", delay: "0.18s" },
                    { color: "#28c840", delay: "0.36s" },
                  ].map((dot, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: dot.color,
                        color: dot.color,
                        animation: "dotGlow 1.4s ease-in-out infinite",
                        animationDelay: dot.delay,
                        boxShadow: "0 0 0 rgba(255,255,255,0)",
                      }}
                    />
                  ))}
                </div>

                <Link
                  href="/services"
                  className="group relative mb-4 block overflow-hidden rounded-[24px] p-[1px] lg:hidden"
                >
                  <div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(59,130,246,0.42),rgba(255,255,255,0.94),rgba(14,165,233,0.24))]" />
                  <div className="relative rounded-[23px] border border-[#dbeafe] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.08)] transition duration-300 group-hover:-translate-y-[1px] group-hover:shadow-[0_16px_30px_rgba(37,99,235,0.11)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0b1720] text-white shadow-sm">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                            Platform overview
                          </p>
                          <h3 className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-neutral-950">
                            Explore our services
                          </h3>
                          <p className="mt-1.5 text-xs leading-5 text-neutral-600">
                            Rent, water bills, inspections, staff, and more.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full bg-white p-2 text-[#2563eb] shadow-sm transition duration-300 group-hover:translate-x-0.5">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <CreditCard className="h-3.5 w-3.5 text-neutral-500" />
                        Rent
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <Droplets className="h-3.5 w-3.5 text-neutral-500" />
                        Water Bills
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <ClipboardList className="h-3.5 w-3.5 text-neutral-500" />
                        Inspections
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <Users2 className="h-3.5 w-3.5 text-neutral-500" />
                        Staff
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-600 shadow-sm backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure sign in
                </div>

                <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[32px]">
                  Welcome back
                </h2>

                <p className="mt-2 max-w-md text-sm leading-5 text-neutral-600">
                  Sign in to manage your workspace, property operations,
                  billing workflows, and daily team activity.
                </p>
              </div>

              <LoginForm />
            </div>

            <div className="pt-3 text-center text-[11px] text-neutral-500 lg:hidden">
              © {new Date().getFullYear()} EstateDesk
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}