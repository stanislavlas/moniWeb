import { Spinner } from "./Spinner.jsx";

/**
 * A submit button that shows a spinner while `loading` is true.
 * Props: { loading, label, className? }
 */
export function SubmitButton({ loading, label, className = "" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`flex justify-center items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {loading ? <Spinner size={4} /> : label}
    </button>
  );
}
