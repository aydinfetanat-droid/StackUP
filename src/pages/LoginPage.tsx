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
    <div className="flex min-h-screen flex-col justify-center bg-ink-50 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-ink-900">StackUp</h1>
          <p className="mt-1 text-sm text-ink-500">Welcome back.</p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-ink-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-ink-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm font-medium text-rust-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-accent mt-2 w-full">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-ink-900 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
