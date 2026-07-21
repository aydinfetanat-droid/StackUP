import { useState } from "react";
import { Sun, Moon, Laptop, Bell, Target, Volume2, Vibrate, User, Globe, Info } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticsEnabled,
  setHapticsEnabled,
  getDailyGoalLessons,
  setDailyGoalLessons,
} from "../lib/preferences";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ${on ? "bg-forest-600" : "bg-ink-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-transform duration-150 ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function Row({ icon: Icon, label, sub, children }: { icon: typeof Sun; label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink-900">{label}</p>
        {sub && <p className="text-xs text-ink-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { preference, setPreference } = useTheme();
  const { profile, signOut } = useAuth();
  const [sound, setSound] = useState(isSoundEnabled());
  const [haptics, setHaptics] = useState(isHapticsEnabled());
  const [dailyGoal, setDailyGoal] = useState(getDailyGoalLessons());
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      <PageHeader title="Settings" />

      <main className="px-5 pt-6">
        <section className="mb-6">
          <p className="label-caps mb-2">Appearance</p>
          <div className="card divide-y divide-ink-100">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600">
                {preference === "dark" ? <Moon size={16} /> : preference === "light" ? <Sun size={16} /> : <Laptop size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">Theme</p>
                <p className="text-xs text-ink-500">Light, dark, or match your device</p>
              </div>
            </div>
            <div className="flex gap-2 p-4 pt-0">
              {(["light", "dark", "system"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPreference(opt)}
                  className={`tap flex-1 rounded-md border py-2.5 text-sm font-medium capitalize transition-colors duration-150 ${
                    preference === opt ? "border-ink-900 bg-onyx text-white" : "border-ink-200 text-ink-600 hover:border-ink-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <p className="label-caps mb-2">Learning</p>
          <div className="card divide-y divide-ink-100">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600">
                <Target size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">Daily goal</p>
                <p className="text-xs text-ink-500">{dailyGoal} lesson{dailyGoal === 1 ? "" : "s"} a day</p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setDailyGoal(n);
                      setDailyGoalLessons(n);
                    }}
                    className={`tap flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150 ${
                      dailyGoal === n ? "bg-onyx text-white" : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Row icon={Bell} label="Notifications" sub="Streak reminders and lesson nudges">
              <Toggle on={notifications} onChange={setNotifications} />
            </Row>
          </div>
        </section>

        <section className="mb-6">
          <p className="label-caps mb-2">Sound &amp; feel</p>
          <div className="card divide-y divide-ink-100">
            <Row icon={Volume2} label="Sound effects" sub="Correct/incorrect and celebration sounds">
              <Toggle
                on={sound}
                onChange={(v) => {
                  setSound(v);
                  setSoundEnabled(v);
                }}
              />
            </Row>
            <Row icon={Vibrate} label="Haptics" sub="Vibration on key interactions">
              <Toggle
                on={haptics}
                onChange={(v) => {
                  setHaptics(v);
                  setHapticsEnabled(v);
                }}
              />
            </Row>
          </div>
        </section>

        <section className="mb-6">
          <p className="label-caps mb-2">Account</p>
          <div className="card divide-y divide-ink-100">
            <Row icon={User} label={profile?.display_name ?? "Account"} sub={profile?.school ?? ""}>
              <span />
            </Row>
            <Row icon={Globe} label="Language" sub="English (US)">
              <span />
            </Row>
          </div>
        </section>

        <section className="mb-6">
          <div className="card flex items-start gap-3 p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-ink-400" />
            <p className="text-sm leading-relaxed text-ink-600">
              StackUp is an educational tool. Nothing in this app — lessons, News, or StackMarket — is financial advice.
              StackMarket is a simulator using virtual currency only; no real money is ever involved.
            </p>
          </div>
        </section>

        <button onClick={() => signOut()} className="btn btn-outline w-full">
          Log out
        </button>
      </main>
    </div>
  );
}
