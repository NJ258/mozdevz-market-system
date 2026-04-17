import Link from "next/link";
import { ReactNode } from "react";

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  badgeType?: "success" | "warning" | "danger" | "accent";
};

// Classes CSS para os diferentes tipos de badges usados no menu lateral.
const badgeClasses = {
  success: "bg-(--success)/10 text-(--success) border border-(--success)/20",
  warning: "bg-(--warning)/10 text-(--warning) border border-(--warning)/20",
  danger: "bg-(--danger)/10 text-(--danger) border border-(--danger)/20",
  accent: "bg-(--accent)/10 text-(--accent) border border-(--accent)/20",
};

export default function SidebarItem({ icon, label, href, active, badge, badgeType = "accent" }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-(--text-secondary) transition hover:border-(--border) hover:bg-(--bg-elevated) hover:text-(--text-primary) ${
        active ? "bg-(--bg-elevated) text-(--accent-text)" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--bg-elevated) text-(--accent-text)">
          {icon}
        </span>
        <span>{label}</span>
      </div>

      {badge ? (
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badgeClasses[badgeType]}`}>
          {badge}
        </span>
      ) : null}
    </Link>
  );
}


