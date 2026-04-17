type StatusTagProps = {
  status: "ok" | "low" | "critical";
  label: string;
};

// Mapeia cada estado para as classes de estilo correspondentes.
const statusClasses = {
  ok: "bg-(--success-bg) text-(--success)",
  low: "bg-(--warning-bg) text-(--warning)",
  critical: "bg-(--danger-bg) text-(--danger)",
};

export default function StatusTag({ status, label }: StatusTagProps) {
  return (
    <span className={`inline-flex rounded-full border border-(--border) px-3 py-1 text-[11px] font-medium ${statusClasses[status]}`}>
      {label}
    </span>
  );
}


