export default function SettingsPage() {
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-(--text-primary)">Definições</h1>
        <p className="mt-2 text-(--text-secondary)">Ajuste preferências da aplicação e monitorize configurações gerais.</p>
      </div>

      <section className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-primary)">Preferências da conta</h2>
        <p className="mt-3 text-(--text-secondary)">Esta página será usada para configurações futuras de notificações e aparência.</p>
      </section>
    </main>
  );
}


