import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="rounded-[32px] border border-(--border) bg-(--bg-elevated) p-10 shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--accent-text)">TirhaTech</p>
          <h1 className="text-5xl font-semibold tracking-tight text-(--text-primary)">Gestão de vendas e stock</h1>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Produtos", href: "/products" },
          { title: "Vendas", href: "/sales" },
          { title: "Estoque", href: "/stock" },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 transition hover:-translate-y-1 hover:border-(--accent) hover:bg-(--bg-accent)"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-(--text-faint)">{item.title}</p>
            <h2 className="mt-4 text-2xl font-semibold text-(--text-primary)">{item.title}</h2>
          </Link>
        ))}
      </section>

    </main>
  );
}
