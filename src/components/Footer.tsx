import StatusPulse from "./StatusPulse";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-text-muted)]">
      <div className="mb-2 flex justify-center">
        <StatusPulse />
      </div>
      © {new Date().getFullYear()} Harvey · Digital Garden
    </footer>
  );
}
