export function FeedbackBanner({ message, type = "error", onDismiss }) {
  if (!message) return null;
  const colors = {
    error:   "bg-brand-redLight text-brand-redDark border-brand-redBorder",
    success: "bg-brand-greenLight text-brand-greenDark border-brand-greenBorder",
    info:    "bg-brand-blueLight text-brand-blueDark border-blue-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex justify-between items-start ${colors[type] || colors.error}`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-lg leading-none opacity-60 hover:opacity-100">×</button>
      )}
    </div>
  );
}
