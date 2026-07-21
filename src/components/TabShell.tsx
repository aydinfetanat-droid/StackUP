import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { House, GraduationCap, LineChart, Newspaper, CircleUser } from "lucide-react";
import { Onboarding, hasSeenOnboarding } from "./Onboarding";

const TABS = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/learn", label: "Learn", Icon: GraduationCap, end: false },
  { to: "/market", label: "Market", Icon: LineChart, end: false },
  { to: "/news", label: "News", Icon: Newspaper, end: false },
  { to: "/profile", label: "Profile", Icon: CircleUser, end: false },
];

export function TabShell() {
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

  return (
    <div className="min-h-screen bg-ink-50">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}

      <div style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
        <Outlet />
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-ink-200 bg-surface"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-150 ${
                isActive ? "text-ink-900" : "text-ink-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-forest-500"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.span animate={{ scale: isActive ? 1.08 : 1 }} transition={{ duration: 0.15 }}>
                  <Icon size={19} strokeWidth={isActive ? 2.25 : 1.75} />
                </motion.span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
