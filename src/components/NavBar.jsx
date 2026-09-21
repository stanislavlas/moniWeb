import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/month",      label: "Month"      },
  { to: "/year",       label: "Year"       },
  { to: "/add",        label: "+ Add"      },
  { to: "/history",    label: "History"    },
  { to: "/household",  label: "Household"  },
  { to: "/categories", label: "Categories" },
  { to: "/account",    label: "Account"    },
];

export function NavBar({ onLogout }) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
      <div className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
        <span className="font-bold text-brand-green text-lg mr-4 shrink-0">Moni</span>
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                isActive
                  ? "bg-brand-greenLight text-brand-greenDark"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={onLogout}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 shrink-0"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
