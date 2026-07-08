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
    <div className="flex min-h-screen flex-col justify-center bg-ink-100 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-brand-700">StackUp</h1>
        <p className="mt-1 text-ink-500">Level up your money skills. Create your account.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">Display name</label>
            <input
              className="w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan"
              autoComplete="nickname"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">School</label>
            <select
              className="w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
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
                className="mt-2 w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                value={otherSchool}
                onChange={(e) => setOtherSchool(e.target.value)}
                placeholder="Your school name"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
