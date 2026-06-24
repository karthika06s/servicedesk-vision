import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { signupUser, type Role } from "@/lib/api/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account | ServiceDesk Pro" },
      {
        name: "description",
        content: "Create your ServiceDesk Pro account.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Complete all fields to create your account.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signupUser({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });
      setIsSubmitting(false);
      setIsComplete(true);
    } catch (error) {
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : "Unable to create your account right now.");
    }
  }

  if (isSubmitting || isComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/60"
          role="status"
          aria-live="polite"
        >
          {isSubmitting ? (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <h1 className="mt-7 text-2xl font-bold text-slate-900">
                Creating your account
              </h1>
              <p className="mt-2 text-slate-600">
                Please wait while we prepare your workspace.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-20 w-20 animate-[bounce_700ms_ease-out_1] items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check size={40} strokeWidth={3} />
              </div>
              <h1 className="mt-7 text-3xl font-bold text-slate-900">
                Registration successful
              </h1>
              <p className="mt-3 text-slate-600">
                Your account has been created. You can now sign in with your credentials.
              </p>
              <a
                href="/login"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Continue to Sign In
              </a>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      <section className="hidden w-5/12 flex-col justify-between bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 p-12 text-white lg:flex">
        <a href="/" className="text-2xl font-bold">
          ServiceDesk Pro
        </a>

        <div className="max-w-md">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <UserPlus size={28} />
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Build a better way to deliver service.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-blue-100">
            Create your account and bring your clients, projects, and team into one organized
            workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-blue-100">
          <ShieldCheck size={18} />
          Secure role-based account registration
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-7/12">
        <div className="w-full max-w-lg">
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to home
          </a>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Get started
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="mt-3 text-slate-600">
              Enter your details to register for ServiceDesk Pro.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Username" htmlFor="signup-username">
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  className="form-input"
                />
              </Field>

              <Field label="Email address" htmlFor="signup-email">
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Role" htmlFor="signup-role">
              <select
                id="signup-role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="form-input"
              >
                <option value="client">Client</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Password" htmlFor="signup-password">
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="form-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-800"
                    aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </Field>

              <Field label="Verify password" htmlFor="signup-confirm-password">
                <input
                  id="signup-confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter password again"
                  className="form-input"
                />
              </Field>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
    </div>
  );
}
