import { ReactNode } from "react";

type PanelProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

// Componente genérico de painel para agrupar seções do dashboard.
export default function Panel({ title, action, children }: PanelProps) {
  return (
    <section className="rounded-[12px] border border-(--border) bg-(--bg-surface) p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-(--text-primary)">{title}</h2>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}


