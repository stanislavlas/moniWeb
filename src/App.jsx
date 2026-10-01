import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useTheme } from "./hooks/useTheme.js";
import { HouseholdProvider, useHouseholdContext } from "./contexts/HouseholdContext.jsx";
import { CategoriesProvider, useCategoriesContext } from "./contexts/CategoriesContext.jsx";
import { NavBar } from "./components/NavBar.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { Spinner } from "./components/Spinner.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { MonthOverviewPage } from "./pages/MonthOverviewPage.jsx";
import { YearOverviewPage } from "./pages/YearOverviewPage.jsx";
import { AddPage } from "./pages/AddPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";


function AppContent() {
  const {
    user, isAuthenticated, ready,
    login, register, logout,
    error, clearError, loading,
    pendingRegistration, verifyRegistration,
    resendRegistrationCode, cancelRegistrationVerification,
    deleteAccount, changePassword, updateProfile,
    refreshProfile,
    forgotPassword, resetPassword,
  } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  const [showPersonalOnly, setShowPersonalOnly] = useState(false);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Spinner size={12} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        loading={loading}
        error={error}
        onClearError={clearError}
        pendingRegistration={pendingRegistration}
        onVerifyRegistration={verifyRegistration}
        onResendCode={resendRegistrationCode}
        onCancelRegistration={cancelRegistrationVerification}
        onForgotPassword={forgotPassword}
        onResetPassword={resetPassword}
      />
    );
  }

  return (
    <HouseholdProvider refreshProfile={refreshProfile}>
      <CategoriesProvider>
        <AppRoutes
          user={user}
          isAuthenticated={isAuthenticated}
          logout={logout}
          theme={theme}
          toggleTheme={toggleTheme}
          showPersonalOnly={showPersonalOnly}
          setShowPersonalOnly={setShowPersonalOnly}
          changePassword={changePassword}
          updateProfile={updateProfile}
          deleteAccount={deleteAccount}
        />
      </CategoriesProvider>
    </HouseholdProvider>
  );
}

function AppRoutes({
  user, isAuthenticated, logout, theme, toggleTheme,
  showPersonalOnly, setShowPersonalOnly,
  changePassword, updateProfile, deleteAccount,
}) {
  const {
    household, pendingInvitations, load: loadHousehold, reset: resetHousehold,
  } = useHouseholdContext();

  const { load: loadCategories, reset: resetCategories } = useCategoriesContext();

  // Load household and categories only after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated) {
      loadHousehold();
      loadCategories();
    } else {
      // Reset household and categories state so a subsequent login never sees
      // a previous user's data
      resetHousehold();
      resetCategories();
    }
  }, [isAuthenticated, loadHousehold, loadCategories, resetHousehold, resetCategories]);

  // Reset personal-only toggle when leaving a household
  useEffect(() => {
    if (!household) setShowPersonalOnly(false);
  }, [household, setShowPersonalOnly]);

  const pendingCount = pendingInvitations?.length ?? 0;
  const showHousehold = !!household && !showPersonalOnly;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white">
      <NavBar onLogout={logout} theme={theme} onToggleTheme={toggleTheme} pendingCount={pendingCount} showToggle={!!user?.householdId} showPersonalOnly={showPersonalOnly} onToggleView={() => setShowPersonalOnly(v => !v)} />
      <Routes>
        <Route path="/" element={<Navigate to="/month" replace />} />
        <Route
          path="/month"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><MonthOverviewPage user={user} showHousehold={showHousehold} /></PrivateRoute>}
        />
        <Route
          path="/year"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><YearOverviewPage user={user} showHousehold={showHousehold} /></PrivateRoute>}
        />
        <Route
          path="/add"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><AddPage user={user} /></PrivateRoute>}
        />
        <Route
          path="/history"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><HistoryPage user={user} showHousehold={showHousehold} /></PrivateRoute>}
        />
        <Route
          path="/account"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <AccountPage
                user={user}
                onChangePassword={changePassword}
                onUpdateProfile={updateProfile}
                onDeleteAccount={deleteAccount}
              />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/month" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ErrorBoundary currently wraps the entire app — any unhandled render error
          will show a full-page fallback. If finer-grained recovery is needed in
          the future, consider wrapping individual pages instead. */}
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
