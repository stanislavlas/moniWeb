import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import { NavBar } from "./components/NavBar.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { Spinner } from "./components/Spinner.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { MonthOverviewPage } from "./pages/MonthOverviewPage.jsx";
import { YearOverviewPage } from "./pages/YearOverviewPage.jsx";
import { AddPage } from "./pages/AddPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { CategoriesPage } from "./pages/CategoriesPage.jsx";
import { HouseholdPage } from "./pages/HouseholdPage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";

function AppContent() {
  const {
    user, isAuthenticated, ready,
    login, register, logout,
    error, clearError, loading,
    pendingRegistration, verifyRegistration,
    resendRegistrationCode, cancelRegistrationVerification,
    deleteAccount, changePassword, updateProfile,
  } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white">
      <NavBar onLogout={logout} />
      <Routes>
        <Route path="/" element={<Navigate to="/month" replace />} />
        <Route
          path="/month"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><MonthOverviewPage /></PrivateRoute>}
        />
        <Route
          path="/year"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><YearOverviewPage /></PrivateRoute>}
        />
        <Route
          path="/add"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><AddPage /></PrivateRoute>}
        />
        <Route
          path="/history"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><HistoryPage /></PrivateRoute>}
        />
        <Route
          path="/categories"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><CategoriesPage /></PrivateRoute>}
        />
        <Route
          path="/household"
          element={<PrivateRoute isAuthenticated={isAuthenticated}><HouseholdPage user={user} /></PrivateRoute>}
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
