import { NavLink, Outlet } from "react-router-dom";
import { House, LineChart, Newspaper, CircleUser } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/market", label: "StackMarket", Icon: LineChart, end: false },
  { to: "/news", label: "News", Icon: Newspaper, end: false },
  { to: "/profile", label: "Profile", Icon: CircleUser, end: false },
];

export function TabShell() {
  return (
    <div className="min-h-screen bg-ink-50">
      <div style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
        <Outlet />
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-ink-200 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 ${
                isActive ? "text-ink-900" : "text-ink-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
