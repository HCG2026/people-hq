import { Suspense } from "react";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginCard({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-4 py-8 text-[#f4ecd8]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#d8cba3]/15 bg-[#0b1712] p-6 shadow-2xl shadow-black/30">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300/70">People HQ</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#fff8df]">Private access</h1>
        <p className="mt-2 text-sm leading-6 text-[#c9bea0]">
          Enter the app password to unlock your local relationship workspace.
        </p>

        {error === "invalid" && (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Wrong password. Try again.
          </div>
        )}
        {error === "not-configured" && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Password is not configured on this deployment.
          </div>
        )}

        <form action="/api/login" method="post" className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#9f9578]">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              className="field w-full"
              placeholder="Enter password"
            />
          </label>
          <button className="w-full rounded-full bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07110d]">
            Unlock People HQ
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-[#9f9578]">
          Data is still local-first after login. The password gate protects casual public access to the deployed app.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={null}>
      <LoginCard {...props} />
    </Suspense>
  );
}
