type MetricCardProps = {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "up" | "down" | "neutral";
};

const deltaStyles = {
  up: "text-(--success)",
  down: "text-(--danger)",
  neutral: "text-(--text-secondary)",
};

export default function MetricCard({ label, value, delta, deltaType }: MetricCardProps) {
  return (
    <div className="rounded-[12px] border border-(--border) bg-(--bg-surface) p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-(--text-muted)">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-(--text-primary)">{value}</p>
      <p className={`mt-3 text-[11px] flex items-center gap-2 ${deltaStyles[deltaType]}`}>
        <span className={`inline-flex h-2 w-2 rounded-full ${deltaType === "up" ? "bg-(--success)" : deltaType === "down" ? "bg-(--danger)" : "bg-(--text-secondary)"}`} />
        {delta}
      </p>
    </div>
  );
}


