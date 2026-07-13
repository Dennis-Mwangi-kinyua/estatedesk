import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Droplets,
  ClipboardList,
  Users2,
} from "lucide-react";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import { publicPageMetadata } from "@/lib/seo";
import { loginAction } from "./actions";
import LoginForm from "./LoginForm";

export const metadata = publicPageMetadata({
  title: "Login Page - EstateDesk Dashboard",
  description:
    "Securely sign in to EstateDesk Dashboard to manage properties, tenants, leases, rent payments, inspections, maintenance, and team access online.",
  path: "/login",
});

const serviceItems = [
  {
    label: "Rent",
    icon: CreditCard,
    tileClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Water",
    icon: Droplets,
    tileClass: "border-sky-200 bg-sky-50 text-sky-800",
    iconClass: "bg-sky-100 text-sky-700",
  },
  {
    label: "Inspect",
    icon: ClipboardList,
    tileClass: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    label: "Staff",
    icon: Users2,
    tileClass: "border-violet-200 bg-violet-50 text-violet-800",
    iconClass: "bg-violet-100 text-violet-700",
  },
];

const windowDots = [
  {
    color: "#ff5f57",
    delay: "0s",
  },
  {
    color: "#febc2e",
    delay: "0.18s",
  },
  {
    color: "#28c840",
    delay: "0.36s",
  },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = params?.returnTo?.startsWith("/") && !params.returnTo.startsWith("//") ? params.returnTo : undefined;

  return (
    <div className="login-screen fixed inset-0 w-screen overflow-hidden bg-white text-slate-950">
      <style>{`
        .login-screen {
          height: 100svh;
          height: 100dvh;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: auto;
        }

        .login-shell {
          padding-top: max(10px, env(safe-area-inset-top));
          padding-bottom: max(10px, env(safe-area-inset-bottom));
        }

        @keyframes dotGlow {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
            opacity: 0.86;
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

        @media (max-width: 1023px) {
          .login-screen {
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
          }

          .login-shell {
            height: auto;
            min-height: 100%;
            overflow: visible;
          }

          .login-content {
            height: auto;
            min-height: 100%;
          }

          .mobile-card {
            flex: none;
            overflow: visible;
          }

          .login-form-shell {
            min-height: 0;
            flex: none;
            overflow: visible;
          }

          .login-form-shell form {
            min-height: 0;
          }

          .login-form-shell input,
          .login-form-shell select,
          .login-form-shell textarea {
            min-height: 42px;
            height: 42px;
            border-radius: 16px;
            font-size: 16px;
          }

          .login-form-shell button {
            min-height: 44px;
            border-radius: 16px;
          }
        }

        @media (max-width: 380px) {
          .mobile-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mobile-card {
            border-radius: 28px;
          }
        }

      `}</style>

      <div className="h-full min-h-0 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <aside className="hidden h-full overflow-hidden lg:block">
          <OperationsShowcase compact />
        </aside>

        <main className="login-shell mobile-page relative flex h-full min-h-0 items-stretch justify-center overflow-hidden px-3 lg:items-center lg:px-8 xl:px-10">
          <div className="absolute inset-0 bg-white" />

          <div className="login-content relative z-10 flex h-full min-h-0 w-full max-w-[430px] flex-col gap-2 lg:h-auto lg:max-w-md">
            <div className="ios-status-bar flex h-6 shrink-0 items-center justify-between px-5 text-[12px] font-semibold tracking-[-0.02em] text-slate-800 lg:hidden">
              <span>9:41</span>

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <span className="flex h-3 w-5 items-center rounded-[5px] border border-slate-800 p-[1px]">
                  <span className="h-full w-[70%] rounded-[4px] bg-slate-800" />
                </span>
              </div>
            </div>

            <div className="shrink-0 lg:hidden">
              <div className="mobile-home-pill flex w-full items-center rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center text-[15px] font-semibold tracking-[-0.02em] text-slate-950"
                >
                  <span className="mr-2 text-lg">🏠</span>
                  <span>EstateDesk</span>
                </Link>
              </div>
            </div>

            <section className="mobile-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:flex-none">

              <div className="mobile-header relative shrink-0 border-b border-slate-100/90 px-5 pb-4 pt-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {windowDots.map((dot, index) => (
                      <span
                        key={index}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: dot.color,
                          color: dot.color,
                          animation: "dotGlow 1.4s ease-in-out infinite",
                          animationDelay: dot.delay,
                        }}
                      />
                    ))}
                  </div>

                  <div className="h-1.5 w-16 rounded-full bg-slate-300/70 lg:hidden" />
                </div>

                <Link
                  href="/services"
                  className="mobile-service-card group mb-3 block overflow-hidden rounded-[24px] border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition duration-300 active:scale-[0.99] lg:hidden"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                        <Building2 className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Platform overview
                        </p>
                        <h3 className="truncate text-[14px] font-semibold tracking-[-0.02em] text-slate-950">
                          Explore our services
                        </h3>
                      </div>
                    </div>

                    <div className="rounded-full bg-white p-2 text-slate-700 shadow-sm">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mobile-service-tags mt-3 grid grid-cols-2 gap-2">
                    {serviceItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className={`flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2 text-xs font-semibold ${item.tileClass}`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </Link>

                <div className="flex items-center justify-center gap-3 lg:justify-between">
                  <Link
                    href="/"
                    className="hidden min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950 lg:inline-flex"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to EstateDesk
                  </Link>
                  <div className="secure-pill inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                    Secure log in
                  </div>
                </div>

                <h2 className="mobile-title mt-4 text-center text-[clamp(1.75rem,7vw,2rem)] font-semibold leading-none tracking-[-0.045em] text-slate-950">
                  Welcome back
                </h2>

                <p className="mobile-copy mx-auto mt-2 max-w-[320px] text-center text-sm leading-5 text-slate-600">
                  Log in to manage your workspace, property operations, billing
                  workflows, and daily team activity.
                </p>
              </div>

              <div className="login-form-shell relative min-h-0 flex-1 overflow-hidden">
          <LoginForm returnTo={returnTo} loginAction={loginAction} />
              </div>
            </section>

            <div className="mobile-footer shrink-0 pb-1 text-center text-[11px] text-slate-500 lg:hidden">
              © {new Date().getFullYear()} EstateDesk
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
