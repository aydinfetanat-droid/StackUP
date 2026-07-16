import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/market", label: "StackMarket", icon: "📈", end: false },
  { to: "/news", label: "News", icon: "📰", end: false },
  { to: "/profile", label: "Profile", icon: "👤", end: false },
];

export function TabShell() {
  return (
    <div className="min-h-screen bg-ink-100">
      <div style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
        <Outlet />
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-ink-300 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                isActive ? "text-brand-600" : "text-ink-500"
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
