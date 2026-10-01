import { createContext, useContext } from "react";
import { useHousehold } from "../hooks/useHousehold.js";

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children, refreshProfile }) {
  // useHousehold holds state but does NOT auto-fetch on mount.
  // App.jsx triggers load() only after the user is authenticated via:
  //   useEffect(() => { if (isAuthenticated) loadHousehold(); }, [isAuthenticated])
  // This prevents unauthenticated API calls on cold load.
  const household = useHousehold();
  return (
    <HouseholdContext.Provider value={{ ...household, refreshProfile }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHouseholdContext must be used inside HouseholdProvider");
  return ctx;
}
