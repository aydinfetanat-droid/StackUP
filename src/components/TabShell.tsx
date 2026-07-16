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
      <div style={{ paddingBottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}>
        <Outlet />
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-ink-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${
                isActive ? "text-brand-600" : "text-ink-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-2xl text-xl leading-none transition-all ${
                    isActive ? "scale-110 bg-brand-100" : ""
                  }`}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
