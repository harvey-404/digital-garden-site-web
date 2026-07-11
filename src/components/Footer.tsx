export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-text-muted)]">
      © {new Date().getFullYear()} Harvey · Digital Garden
    </footer>
  );
}
