import { NavLink, Link } from "react-router-dom";

const TABS = [
  { to: "/month",   label: "Month",   emoji: "📅" },
  { to: "/year",    label: "Year",    emoji: "📊" },
  { to: "/add",     label: "Add",     emoji: "+"  },
  { to: "/history", label: "History", emoji: "🕐" },
  { to: "/account", label: "Account", emoji: "👤" },
];

export function NavBar({ onLogout, theme, onToggleTheme, pendingCount = 0, household, showPersonalOnly, onToggleView }) {
  return (
    <>
      {/* ── Desktop top bar (hidden on mobile) ── */}
      <header className="hidden sm:block sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center px-4 py-2">
          {/* Logo + app name */}
          <Link to="/month" className="flex items-center gap-2 shrink-0 select-none">
            <img src="/no_background.png" alt="Moni logo" className="w-7 h-7 object-contain" />
            <span className="font-bold text-brand-green text-lg">Moni</span>
          </Link>

          {/* Tabs — centered absolutely so logo/logout don't affect position */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            {TABS.map(tab => {
              if (tab.to === "/add") {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className="flex items-center justify-center shrink-0 mx-1"
                  >
                    <span
                      className="flex items-center justify-center shadow-md select-none text-[#6B63B5] dark:text-[#A89FD6] bg-[#E8E6F5] dark:bg-[#2D2B52]"
                      style={{ width: 46, height: 46, borderRadius: 14, fontSize: 28, fontWeight: 300, lineHeight: 1 }}
                    >
                      +
                    </span>
                  </NavLink>
                );
              }

              const isAccount = tab.to === "/account" && pendingCount > 0;

              return (
                <NavLink key={tab.to} to={tab.to} className="flex-shrink-0">
                  {({ isActive }) => (
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1.5 transition-colors"
                      style={{
                        backgroundColor: isActive ? "var(--pill-bg, #ECEAF8)" : "transparent",
                        borderRadius: 12,
                      }}
                    >
                      <span className="relative">
                        <span style={{ fontSize: 14, lineHeight: 1 }}>{tab.emoji}</span>
                        {isAccount && !isActive && (
                          <span
                            className="absolute bg-red-500 border border-white dark:border-neutral-900 rounded-full"
                            style={{ width: 6, height: 6, top: -1, right: -2 }}
                          />
                        )}
                      </span>
                      <span
                        className="text-sm text-gray-900 dark:text-white"
                        style={{ fontWeight: isActive ? 700 : 400, opacity: isActive ? 1 : 0.45 }}
                      >
                        {tab.label}
                      </span>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Right: household/personal toggle + theme toggle + logout */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {household && (
              <button
                onClick={onToggleView}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={showPersonalOnly
                  ? { borderColor: "#e5e7eb", color: "#6b7280", backgroundColor: "transparent" }
                  : { borderColor: "#9BD4BE", color: "#0F6E56", backgroundColor: "#E1F5EE" }
                }
              >
                🏠
              </button>
            )}
            <button
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-green hover:bg-brand-greenLight dark:hover:bg-neutral-800 border border-brand-greenBorder"
            >
              {theme === "dark" ? "☀︎" : "☾"}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar (visible only on mobile) ── */}
      <header className="sm:hidden sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 py-2">
          <Link to="/month" className="flex items-center gap-2 select-none">
            <img src="/no_background.png" alt="Moni logo" className="w-7 h-7 object-contain" />
            <span className="font-bold text-brand-green text-lg">Moni</span>
          </Link>
          <div className="flex items-center gap-1">
            {household && (
              <button
                onClick={onToggleView}
                className="px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={showPersonalOnly
                  ? { borderColor: "#e5e7eb", color: "#6b7280", backgroundColor: "transparent" }
                  : { borderColor: "#9BD4BE", color: "#0F6E56", backgroundColor: "#E1F5EE" }
                }
              >
                🏠
              </button>
            )}
            <button
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-brand-green border border-brand-greenBorder"
            >
              {theme === "dark" ? "☀︎" : "☾"}
            </button>
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-500"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex safe-bottom">
        {TABS.map(tab => {
          const isAccount = tab.to === "/account" && pendingCount > 0;
          const isAdd = tab.to === "/add";

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex-1 flex flex-col items-center justify-center py-2 min-w-0"
            >
              {({ isActive }) => (
                isAdd ? (
                  <span
                    className="flex items-center justify-center shadow-md text-[#6B63B5] dark:text-[#A89FD6] bg-[#E8E6F5] dark:bg-[#2D2B52]"
                    style={{ width: 44, height: 44, borderRadius: 14, fontSize: 26, fontWeight: 300, lineHeight: 1 }}
                  >
                    +
                  </span>
                ) : (
                  <>
                    <span className="relative">
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
                      {isAccount && !isActive && (
                        <span
                          className="absolute bg-red-500 border border-white dark:border-neutral-900 rounded-full"
                          style={{ width: 7, height: 7, top: -1, right: -2 }}
                        />
                      )}
                    </span>
                    <span
                      className="text-[10px] mt-0.5 leading-none"
                      style={{
                        color: isActive ? "#1D9E75" : "#9ca3af",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {tab.label}
                    </span>
                  </>
                )
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
