import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginUser, type Role } from "@/lib/api/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | ServiceDesk Pro" },
      {
        name: "description",
        content: "Sign in to your ServiceDesk Pro account.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!username.trim() || !password.trim()) {
      setMessage("Enter your username and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await loginUser({
        username: username.trim(),
        password,
        role,
      });

      localStorage.setItem(
        "servicedesk_session",
        JSON.stringify({
          id: user.id,
          publicId: user.publicId,
          username: user.username,
          email: user.email,
          role: user.role,
          token: user.token,
          expiresAt: user.expiresAt,
          loggedInAt: Date.now(),
        }),
      );
      window.location.href =
        user.role === "admin"
          ? "/dashboard"
          : user.role === "client"
            ? "/client-dashboard"
            : "/employee-dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      <section className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-700 to-indigo-900 p-12 text-white lg:flex">
        <a href="/" className="text-2xl font-bold">
          ServiceDesk Pro
        </a>

        <div className="max-w-lg">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <LockKeyhole size={28} />
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Your work, clients, and team in one secure place.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-blue-100">
            Sign in with the role assigned to your account to access your personalized workspace.
          </p>
        </div>

        <p className="text-sm text-blue-200">
          Protected by role-based access controls
        </p>
      </section>

      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to home
          </a>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-3 text-slate-600">
              Enter your credentials and select your account role.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-800">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="client">Client</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {message && (
              <p
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
