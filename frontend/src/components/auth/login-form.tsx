"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Store,
} from "lucide-react";

import { ApiError } from "@/libs/api-client";
import { getValidToken, saveSession } from "@/libs/auth-storage";
import { authService } from "@/services/auth-service";

function getSafeReturnUrl(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/dashboard";
  }

  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));

  // Already signed in: skip the login page.
  useEffect(() => {
    if (getValidToken()) {
      router.replace(returnUrl);
    }
  }, [returnUrl, router]);

  // Remove the unwanted tracking parameter from the URL.
  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.has("utm_source")) {
      url.searchParams.delete("utm_source");

      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, []);

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      if (!response.access_token) {
        throw new Error("The server did not return an access token.");
      }

      if (!response.user.is_active) {
        throw new Error(
          "This account is deactivated. Contact your administrator.",
        );
      }

      saveSession(response);

      // The current Laravel API does not process remember-me.
      void remember;

      router.replace(returnUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 401:
          case 422:
            setError("Your email or password is incorrect. Please try again.");
            break;

          case 403:
            setError(
              "This account is deactivated. Contact your administrator.",
            );
            break;

          case 429:
            setError("Too many attempts. Please wait before trying again.");
            break;

          default:
            setError(err.message || "Unable to sign in. Please try again.");
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the server.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 sm:p-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-cyan-200/50 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-sky-900/10 ring-1 ring-sky-100 lg:min-h-[760px] lg:grid-cols-[1.05fr_1fr]">
        {/* Retail POS brand panel */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-sky-400 via-sky-600 to-blue-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/3 -translate-y-1/3 rounded-full border border-white/15" />

          <div className="relative flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white text-sky-700 shadow-lg">
              <Store size={27} />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight">Retail POS</p>
              <p className="text-xs text-sky-100">Retail management system</p>
            </div>
          </div>

          <div className="relative max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              Everything in one place
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight xl:text-[2.75rem]">
              Manage your business, smarter.
            </h1>

            <p className="mt-5 text-base leading-relaxed text-sky-50/90">
              Manage sales, inventory and your team in one place, so you can
              spend less time on manual work and more time growing your
              business.
            </p>

            <div className="mt-9 space-y-3">
              <Feature
                icon={<ShoppingCart size={19} />}
                title="Sales & transactions"
                description="Process sales and manage transactions"
              />

              <Feature
                icon={<Boxes size={19} />}
                title="Inventory management"
                description="Track products and stock levels"
              />

              <Feature
                icon={<ChartNoAxesCombined size={19} />}
                title="Business reports"
                description="Monitor sales and business performance"
              />
            </div>
          </div>

          <p className="relative text-xs text-sky-100/70">
            © 2026 Retail POS. All rights reserved.
          </p>

          <Store
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-6 size-64 text-white/[0.08]"
            strokeWidth={1}
          />
        </aside>

        {/* Login panel */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full max-w-[26rem]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid size-11 place-items-center rounded-xl bg-sky-600 text-white">
                <Store size={24} />
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">Retail POS</p>
                <p className="text-xs text-slate-500">Management workspace</p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
                Welcome back
              </p>

              <h2 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight text-slate-900">
                Sign in to your workspace
              </h2>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                Access your sales, inventory, reports and team management tools.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-red-100">
                  !
                </span>

                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <fieldset
                disabled={loading}
                className="m-0 min-w-0 space-y-5 border-0 p-0"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      required
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      placeholder="name@example.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:bg-slate-50"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Use the email your administrator registered.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      onKeyDown={handlePasswordKey}
                      onKeyUp={handlePasswordKey}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-16 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-600 transition hover:bg-sky-50"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="mr-1 inline" size={14} />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 inline" size={14} />
                          Show
                        </>
                      )}
                    </button>
                  </div>

                  {capsLock && (
                    <p className="mt-1.5 text-xs font-medium text-amber-600">
                      Caps Lock is on.
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="size-4 rounded border-slate-300 accent-sky-500"
                  />
                  Keep me signed in on this device
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-[15px] font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </fieldset>
            </form>

            <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Staff access only
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3.5 text-sm text-slate-600">
              <ShieldCheck size={20} className="shrink-0 text-sky-600" />
              <span>
                Accounts are created and managed by your administrator.
              </span>
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <LockKeyhole size={12} />
              Secure access to your Retail POS workspace
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/20">
        {icon}
      </span>

      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-sky-100/80">{description}</p>
      </div>

      <Check size={15} className="ml-auto shrink-0 text-sky-100/80" />
    </div>
  );
}
