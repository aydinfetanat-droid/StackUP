import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 px-6 py-10">
      <div className="pointer-events-none absolute -left-16 -top-10 h-56 w-56 rounded-full bg-gold-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-grape-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">
            🐷
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white">StackUp</h1>
          <p className="mt-1 font-semibold text-brand-100">Welcome back.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl">
          <div>
            <label className="mb-1 block text-sm font-bold text-ink-700">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border-2 border-ink-100 bg-ink-100 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-ink-700">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border-2 border-ink-100 bg-ink-100 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm font-medium text-coral-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-chunky btn-chunky--brand mt-2 w-full">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-brand-100">
          New here?{" "}
          <Link to="/signup" className="font-extrabold text-white underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
