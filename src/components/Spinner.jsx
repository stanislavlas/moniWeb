export function Spinner({ size = 6 }) {
  const dim = `w-${size} h-${size}`;
  return (
    <div
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      className="rounded-full border-2 border-brand-green border-t-transparent animate-spin"
    />
  );
}
