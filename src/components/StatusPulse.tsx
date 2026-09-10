interface StatusPulseProps {
  label?: string;
}

export default function StatusPulse({ label = "system online" }: StatusPulseProps) {
  return (
    <span className="dg-status" title="garden kernel ready">
      <span className="dg-status__dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
