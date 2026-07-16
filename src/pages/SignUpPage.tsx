import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SCHOOL_OPTIONS = ["Corona del Mar HS", "Other"];

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [schoolChoice, setSchoolChoice] = useState(SCHOOL_OPTIONS[0]);
  const [otherSchool, setOtherSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const school = schoolChoice === "Other" ? otherSchool.trim() : schoolChoice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) return setError("Enter a display name.");
    if (!school) return setError("Enter your school name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setSubmitting(true);
    const { error } = await signUp(email.trim(), password, displayName.trim(), school);
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 px-6 py-10">
      <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-gold-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-grape-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">
            🐷
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white">StackUp</h1>
          <p className="mt-1 font-semibold text-brand-100">Level up your money skills.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl">
          <div>
            <label className="mb-1 block text-sm font-bold text-ink-700">Display name</label>
            <input
              className="w-full rounded-2xl border-2 border-ink-100 bg-ink-100 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan"
              autoComplete="nickname"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-ink-700">School</label>
            <select
              className="w-full rounded-2xl border-2 border-ink-100 bg-ink-100 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
              value={schoolChoice}
              onChange={(e) => setSchoolChoice(e.target.value)}
            >
              {SCHOOL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {schoolChoice === "Other" && (
              <input
                className="mt-2 w-full rounded-2xl border-2 border-ink-100 bg-ink-100 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
                value={otherSchool}
                onChange={(e) => setOtherSchool(e.target.value)}
                placeholder="Your school name"
              />
            )}
          </div>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm font-medium text-coral-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-chunky btn-chunky--brand mt-2 w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-brand-100">
          Already have an account?{" "}
          <Link to="/login" className="font-extrabold text-white underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
