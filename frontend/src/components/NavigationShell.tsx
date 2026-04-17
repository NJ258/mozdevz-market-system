"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import SidebarItem from "./ui/SidebarItem";

// Componente de layout principal que contém o header, o menu lateral e o local
// onde o conteúdo da página é renderizado.

type SidebarNavigationSection = {
  section: string;
  items: {
    label: string;
    href: string;
    icon: ReactNode;
    badge?: string;
    badgeType?: "success" | "warning" | "danger" | "accent";
  }[];
};

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Produtos", href: "/products" },
  { label: "Vendas", href: "/sales" },
  { label: "Estoque", href: "/stock" },
];

const sidebarItems: SidebarNavigationSection[] = [
  {
    section: "NAVEGAÇÃO",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
            <rect x="4" y="4" width="6" height="6" rx="1.5" />
            <rect x="14" y="4" width="6" height="6" rx="1.5" />
            <rect x="4" y="14" width="6" height="6" rx="1.5" />
            <rect x="14" y="14" width="6" height="6" rx="1.5" />
          </svg>
        ),
        badge: undefined,
        badgeType: "accent",
      },
      {
        label: "Vendas",
        href: "/sales",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 17l5-5 4 4 7-7" />
            <path d="M20 17v2H4v-6" />
          </svg>
        ),
        badge: "8",
        badgeType: "accent",
      },
      {
        label: "Produtos",
        href: "/products",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        ),
        badge: undefined,
        badgeType: "accent",
      },
      {
        label: "Estoque",
        href: "/stock",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
            <rect x="5" y="8" width="4" height="10" rx="1" />
            <rect x="10" y="5" width="4" height="13" rx="1" />
            <rect x="15" y="11" width="4" height="7" rx="1" />
          </svg>
        ),
        badge: "3",
        badgeType: "warning",
      },
    ],
  },
  {
    section: "GERAL",
    items: [
      {
        label: "Definições",
        href: "/settings",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7" />
            <path d="M18.5 12a6.5 6.5 0 0 0-.3-1.7l1.7-1.2-2-3.5-2 1.2a6.4 6.4 0 0 0-1.5-.8L13 2h-2l-.4 2.8a6.4 6.4 0 0 0-1.5.8L6.7 4.9 4.7 8.4l1.7 1.2A6.5 6.5 0 0 0 5.5 12c0 .6.1 1.2.3 1.7L4.1 14.9l2 3.5 2-1.2c.5.3 1 .5 1.5.8L11 22h2l.4-2.8c.5-.2 1-.5 1.5-.8l2 1.2 2-3.5-1.7-1.2c.2-.5.3-1.1.3-1.7Z" />
          </svg>
        ),
        badge: undefined,
        badgeType: "accent",
      },
    ],
  },
];

const topbarLinks = navLinks;

const TopbarLink = ({ href, label, active }: { href: string; label: string; active: boolean }) => {
  // Link usado na barra superior para navegar entre as páginas.
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-(--bg-elevated) text-(--accent-text)"
          : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)"
      }`}
    >
      {label}
    </Link>
  );
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7">
    <path d="M18 8a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </svg>
);

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  // Path atual para destacar o item de navegação correto.
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userInitials = "AT";

  return (
    <div className="relative min-h-screen bg-(--bg-base) text-(--text-primary)">
      <header className="fixed inset-x-0 top-0 z-30 h-[52px] border-b border-(--border) bg-(--bg-base) backdrop-blur">
        <div className="mx-auto flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-(--bg-elevated) text-(--text-secondary) transition hover:text-(--text-primary) md:hidden"
              aria-label="Abrir menu"
            >
              <HamburgerIcon />
            </button>
            <div className="flex items-center gap-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-(--accent) text-(--bg-base)">
                <div className="grid h-4 w-4 grid-cols-2 gap-1">
                  <span className="block h-1.5 w-1.5 rounded-full bg-(--bg-base)" />
                  <span className="block h-1.5 w-1.5 rounded-full bg-(--bg-base)" />
                  <span className="block h-1.5 w-1.5 rounded-full bg-(--bg-base)" />
                  <span className="block h-1.5 w-1.5 rounded-full bg-(--bg-base)" />
                </div>
              </div>
              <span className="hidden text-[15px] font-medium text-(--text-primary) md:inline-block">TirhaTech</span>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {topbarLinks.map((item) => (
              <TopbarLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-(--bg-elevated) text-(--text-secondary) transition hover:text-(--text-primary)"
              aria-label="Notificações"
            >
              <BellIcon />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--accent-soft) text-sm font-semibold text-(--text-primary)">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-[52px] min-h-[calc(100vh-52px)] md:flex md:overflow-hidden">
        <aside className="hidden h-[calc(100vh-52px)] w-[200px] shrink-0 border-r border-(--border) bg-(--bg-sidebar) md:block">
        <div className="flex h-full flex-col gap-6 px-4 py-5">
          {sidebarItems.map((section) => (
            <div key={section.section} className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-(--text-faint)">{section.section}</p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={pathname === item.href}
                    badge={item.badge}
                    badgeType={item.badgeType}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-50 h-full w-[260px] border-r border-(--border) bg-(--bg-sidebar) px-4 py-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-(--text-faint)">Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-(--bg-elevated) text-(--text-secondary) transition hover:text-(--text-primary)"
                aria-label="Fechar menu"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-5">
              {sidebarItems.map((section) => (
                <div key={section.section} className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-(--text-faint)">{section.section}</p>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={pathname === item.href}
                        badge={item.badge}
                        badgeType={item.badgeType}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

        <main className="flex-1 min-h-[calc(100vh-52px)] overflow-y-auto bg-(--bg-base) px-4 pb-10 md:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
