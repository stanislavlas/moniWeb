import { useState } from "react";
import { FeedbackBanner } from "../components/FeedbackBanner.jsx";
import { PasswordInput } from "../components/PasswordInput.jsx";
import { CurrencyPicker } from "../components/CurrencyPicker.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useCurrencies } from "../hooks/useCurrencies.js";
import { INPUT_CLASS } from "../utils/styles.js";
import {
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
} from "../services/auth.js";

export function AuthPage({
  onLogin, onRegister, loading, error, onClearError,
  pendingRegistration, onVerifyRegistration, onResendCode, onCancelRegistration,
}) {
  const [mode, setMode]                   = useState("login"); // login | register | forgot | reset
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirm, setConfirm]             = useState("");
  const [currency, setCurrency]           = useState("EUR");
  const [otpCode, setOtpCode]             = useState("");
  const [localError, setLocalError]       = useState(null);
  const [localLoading, setLocalLoading]   = useState(false);
  const [localSuccess, setLocalSuccess]   = useState(null);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode]         = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmNewPw, setConfirmNewPw]   = useState("");
  const { currencies } = useCurrencies();

  const displayError = localError || error;
  const isLoading = loading || localLoading;


  function switchMode(m) {
    setMode(m);
    setLocalError(null);
    setLocalSuccess(null);
    setResetCodeSent(false);
    setResetCode("");
    setNewPassword("");
    setConfirmNewPw("");
    onClearError?.();
  }

  async function handleResetPassword() {
    if (!resetCode.trim()) { setLocalError("Please enter the reset code"); return; }
    if (newPassword !== confirmNewPw) { setLocalError("Passwords do not match"); return; }
    setLocalLoading(true); setLocalError(null);
    try {
      await apiResetPassword(resetCode, newPassword);
      setLocalSuccess("Password reset successfully. Please sign in.");
      switchMode("login");
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    onClearError?.();

    if (mode === "login") {
      onLogin({ email, password });
    } else if (mode === "register") {
      if (password !== confirm) { setLocalError("Passwords do not match"); return; }
      onRegister({ name, email, password, currency });
    } else if (mode === "forgot") {
      setLocalLoading(true);
      try {
        await apiForgotPassword(email);
        setResetCode("");
        setLocalSuccess("Code sent to your email.");
        setResetCodeSent(true);
      } catch (err) {
        setLocalError(err.message);
      } finally {
        setLocalLoading(false);
      }
    }
  }

  // OTP verification screen
  if (pendingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Email</h1>
          <p className="text-sm text-gray-500">Enter the verification code sent to your email.</p>
          <FeedbackBanner message={displayError} onDismiss={onClearError} />
          <input
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={e => setOtpCode(e.target.value)}
            placeholder="6-digit code"
            className={INPUT_CLASS}
          />
          <button
            onClick={() => onVerifyRegistration(otpCode)}
            disabled={isLoading}
            className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? <Spinner size={5} /> : "Verify"}
          </button>
          <div className="flex gap-4 text-sm">
            <button onClick={() => onResendCode(pendingRegistration.email)} className="text-brand-green hover:underline">
              Resend code
            </button>
            <button onClick={onCancelRegistration} className="text-gray-400 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === "login"    ? "Sign in to Moni"  :
           mode === "register" ? "Create account"   :
           mode === "forgot"   ? "Reset password"   : "Set new password"}
        </h1>

        <FeedbackBanner message={displayError} onDismiss={() => { setLocalError(null); onClearError?.(); }} />
        <FeedbackBanner message={localSuccess} type="success" onDismiss={() => setLocalSuccess(null)} />

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Full name" required className={INPUT_CLASS} />
          )}

          {(mode === "login" || mode === "register" || (mode === "forgot" && !resetCodeSent)) && (
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required className={INPUT_CLASS} />
          )}

          {(mode === "login" || mode === "register") && (
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          )}

          {mode === "register" && (
            <>
              <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Currency</label>
                <CurrencyPicker value={currency} onChange={setCurrency} currencies={currencies} />
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value)}
                placeholder="Reset code from email" required className={INPUT_CLASS} />
              <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
              <PasswordInput value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} placeholder="Confirm new password" />
            </>
          )}

          {mode === "forgot" && resetCodeSent && (
            <>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" value={resetCode} onChange={e => setResetCode(e.target.value)}
                placeholder="6-digit code" required className={INPUT_CLASS} />
              <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
              <PasswordInput value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} placeholder="Confirm new password" />
            </>
          )}

          {!(mode === "forgot" && resetCodeSent) && (
            <button type="submit" disabled={isLoading}
              className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex justify-center items-center">
              {isLoading ? <Spinner size={5} /> :
               mode === "login"    ? "Sign in"          :
               mode === "register" ? "Create account"   :
               mode === "forgot"   ? "Send reset code"  : "Set new password"}
            </button>
          )}

          {mode === "forgot" && resetCodeSent && (
            <button type="button" disabled={isLoading}
              onClick={handleResetPassword}
              className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex justify-center items-center">
              {isLoading ? <Spinner size={5} /> : "Set new password"}
            </button>
          )}
        </form>

        <div className="flex flex-col gap-2 text-sm">
          {mode === "login" && (
            <>
              <button onClick={() => switchMode("register")} className="text-brand-green hover:underline text-left">
                Don&apos;t have an account? Create one
              </button>
              <button onClick={() => switchMode("forgot")} className="text-gray-400 hover:underline text-left">
                Forgot password?
              </button>
            </>
          )}
          {mode !== "login" && (
            <button onClick={() => switchMode("login")} className="text-brand-green hover:underline text-left">
              Back to sign in
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
