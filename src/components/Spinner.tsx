export default function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="加载中">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </div>
  );
}
