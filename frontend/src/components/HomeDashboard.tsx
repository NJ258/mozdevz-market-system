"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../lib/api";
import { MetricCard, PageHeader, Panel, StatusTag } from "./ui";

// Componente principal do dashboard que exibe métricas, tabelas e alertas.
// Ele carrega os dados do backend e permite visualizar as principais informações
// de stock, vendas e recomendações de produtos para o gestor.

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type Sale = {
  id: number;
  product_id: number;
  quantity: number;
};

type Recommendation = {
  product_id: number;
  product_name: string;
  current_stock: number;
  predicted_demand: number;
  recommended_purchase: number;
};

type StockStatusItem = {
  product_id: number;
  product_name: string;
  total_stock: number;
  total_sales: number;
  current_stock: number;
  status: string;
};

type AlertItem = {
  id?: number;
  tipo?: string;
  prioridade?: "critica" | "alta" | "media" | "info";
  produto_id?: number;
  produto_nome?: string;
  type: string;
  message: string;
  acao_recomendada?: string;
  dias_restantes?: number | null;
};

type ProductRow = {
  id: number;
  name: string;
  quantity: number;
  value: number;
  status: "ok" | "low" | "critical";
};

type SaleRow = {
  id: number;
  productName: string;
  quantity: number;
  value: number;
  timestamp: string;
};

type DashboardSummary = {
  overview: {
    total_products: number;
    total_sales_quantity: number;
    total_stock_quantity: number;
    current_stock_quantity: number;
    alerts_count: number;
  };
  products: Product[];
  sales: Sale[];
  stock_status: StockStatusItem[];
  recommendations: Recommendation[];
  alerts: AlertItem[];
};

type HomeDashboardProps = {
  initialSummary?: DashboardSummary | null;
};

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getGreeting() {
  // Retorna saudação com base na hora atual.
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatCurrency(value: number) {
  // Formata valores numéricos para a notação de moeda local.
  return value.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
}

function priorityBadgeColor(priority: string | undefined) {
  if (priority === "critica") return "bg-(--danger)";
  if (priority === "alta") return "bg-(--accent)";
  if (priority === "media") return "bg-(--warning)";
  return "bg-(--success)";
}

export default function HomeDashboard({ initialSummary = null }: HomeDashboardProps) {
  // Estado local para os dados do dashboard e alertas.
  const [summary, setSummary] = useState<DashboardSummary | null>(initialSummary);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialSummary?.alerts ?? []);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("produtos");

  async function loadAlerts() {
    // Carrega alertas de estoque e validade do backend.
    setAlertsLoading(true);

    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    } finally {
      setAlertsLoading(false);
    }
  }

  useEffect(() => {
    if (initialSummary) return;

    async function loadDashboard() {
      try {
        const response = await fetch("http://127.0.0.1:8000/dashboard/summary", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar resumo do dashboard");
        }

        const data = await response.json();
        setSummary(data);
        setAlerts(data.alerts ?? []);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      }
    }

    loadDashboard();
    loadAlerts();
  }, [initialSummary]);

  const dashboardOverview = summary?.overview ?? {
    total_products: 0,
    total_sales_quantity: 0,
    total_stock_quantity: 0,
    current_stock_quantity: 0,
    alerts_count: 0,
  };
  const dashboardProducts = summary?.products ?? [];
  const dashboardSales = summary?.sales ?? [];
  const dashboardStockStatus = summary?.stock_status ?? [];
  const dashboardRecommendations = summary?.recommendations ?? [];
  const dashboardAlerts = alerts.length > 0 ? alerts : summary?.alerts ?? ([] as AlertItem[]);

  const revenue = useMemo(() => {
    return dashboardSales.reduce((total, sale) => {
      const product = dashboardProducts.find((item) => item.id === sale.product_id);
      return total + (product?.price || 0) * sale.quantity;
    }, 0);
  }, [dashboardSales, dashboardProducts]);

  const forecastValue = useMemo(() => {
    return dashboardRecommendations.reduce((total, item) => total + item.predicted_demand, 0);
  }, [dashboardRecommendations]);

  const productRows = useMemo<ProductRow[]>(() => {
    return dashboardProducts.map((product) => {
      const stock = dashboardStockStatus.find((item) => item.product_id === product.id);
      const quantity = stock?.current_stock ?? 0;
      const value = product.price * quantity;
      const status = quantity === 0 ? "critical" : quantity < 10 ? "low" : "ok";
      return {
        id: product.id,
        name: product.name,
        quantity,
        value,
        status,
      };
    });
  }, [dashboardProducts, dashboardStockStatus]);

  const salesRows = useMemo<SaleRow[]>(() => {
    const latest = [...dashboardSales].slice(-5).reverse();
    return latest.map((sale) => {
      const product = dashboardProducts.find((item) => item.id === sale.product_id);
      return {
        id: sale.id,
        productName: product?.name ?? "Produto",
        quantity: sale.quantity,
        value: (product?.price || 0) * sale.quantity,
        timestamp: "Hoje",
      };
    });
  }, [dashboardSales, dashboardProducts]);

  const chartData = useMemo(() => {
    const values = Array.from({ length: 7 }, (_, index) => ({
      label: weekdays[(new Date().getDay() + index) % 7],
      value: dashboardSales[index] ? dashboardSales[index].quantity : 0,
    }));
    return values;
  }, [dashboardSales]);

  if (!summary) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 md:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-2/5 animate-pulse rounded-full bg-(--bg-elevated)" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[20px] bg-(--bg-elevated) p-4" />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="animate-pulse rounded-[20px] bg-(--bg-elevated) p-6">
              <div className="mb-4 h-6 w-1/3 rounded-full bg-(--bg-base)" />
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-xl bg-(--bg-base)" />
                ))}
              </div>
            </div>
            <div className="animate-pulse rounded-[20px] bg-(--bg-elevated) p-6">
              <div className="mb-4 h-6 w-1/4 rounded-full bg-(--bg-base)" />
              <div className="flex items-end gap-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="h-28 w-full max-w-[28px] rounded-full bg-(--bg-base)" />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="animate-pulse rounded-[20px] bg-(--bg-elevated) p-6">
              <div className="mb-4 h-6 w-1/3 rounded-full bg-(--bg-base)" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-(--bg-base)" />
                ))}
              </div>
            </div>
            <div className="animate-pulse rounded-[20px] bg-(--bg-elevated) p-6">
              <div className="mb-4 h-6 w-1/4 rounded-full bg-(--bg-base)" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-4 rounded-full bg-(--bg-base)" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <PageHeader
        title={`${getGreeting()},   AryBaby`}
        subtitle={new Date().toLocaleDateString("pt-PT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Vendas hoje" value={dashboardOverview.total_sales_quantity} delta="+12% desde ontem" deltaType="up" />
        <MetricCard label="Receita (MTn)" value={formatCurrency(revenue)} delta="+8% desde ontem" deltaType="up" />
        <MetricCard label="Produtos ativos" value={dashboardOverview.total_products} delta="Estável" deltaType="neutral" />
        <MetricCard label="Previsão da semana" value={formatCurrency(forecastValue)} delta="+15%" deltaType="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel
            title="Visão geral de produtos"
            action={
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-(--text-faint)">
                <span className="h-2 w-2 rounded-full bg-(--accent)" />
                Produtos — estoque
              </div>
            }
          >
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("produtos")}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  activeTab === "produtos"
                    ? "bg-(--bg-elevated) text-(--accent-text)"
                    : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)"
                }`}
              >
                Produtos â€” stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vendas")}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  activeTab === "vendas"
                    ? "bg-(--bg-elevated) text-(--accent-text)"
                    : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)"
                }`}
              >
                Últimas vendas
              </button>
            </div>

            {activeTab === "produtos" ? (
              <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-elevated) p-3">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-(--text-muted)">
                      <th className="pb-3 pr-4">Produto</th>
                      <th className="pb-3 pr-4">Qty</th>
                      <th className="hidden pr-4 md:table-cell">Valor (MTn)</th>
                      <th className="pb-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((row) => (
                      <tr key={row.id} className="border-t border-(--border)">
                        <td className="py-3 pr-4 text-(--text-primary)">{row.name}</td>
                        <td className="py-3 pr-4 text-(--text-secondary)">{row.quantity}</td>
                        <td className="hidden pr-4 text-(--text-secondary) md:table-cell">{formatCurrency(row.value)}</td>
                        <td className="py-3">
                          <StatusTag status={row.status} label={row.status === "ok" ? "OK" : row.status === "low" ? "Baixo" : "Crítico"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-elevated) p-3">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr className="text-(--text-muted)">
                        <th className="pb-3 pr-4">Produto</th>
                        <th className="pb-3 pr-4">Qty</th>
                        <th className="hidden md:table-cell">Valor (MTn)</th>
                        <th className="pb-3">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesRows.map((sale) => (
                        <tr key={sale.id} className="border-t border-(--border)">
                          <td className="py-3 pr-4 text-(--text-primary)">{sale.productName}</td>
                          <td className="py-3 pr-4 text-(--text-secondary)">{sale.quantity}</td>
                          <td className="hidden md:table-cell text-(--text-secondary)">{formatCurrency(sale.value)}</td>
                          <td className="py-3 text-(--text-secondary)">{sale.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Últimos 7 dias" action={<span className="text-[11px] uppercase tracking-[0.22em] text-(--text-faint)">Gráfico</span>}>
            <div className="flex items-end gap-3">
              {chartData.map((item) => {
                const height = Math.max(12, item.value * 12);
                return (
                  <div key={item.label} className="flex-1 text-center">
                    <div className="mx-auto mb-2 h-[140px] w-full max-w-[28px] rounded-full bg-(--bg-elevated)">
                      <div className="mx-auto h-full w-full rounded-full bg-(--accent)" style={{ height: `${height}px` }} />
                    </div>
                    <span className="block text-[11px] text-(--text-muted)">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Alertas"
            action={
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.22em] text-(--text-faint)">Status</span>
                <button
                  type="button"
                  onClick={loadAlerts}
                  className="rounded-full border border-(--border) bg-(--bg-elevated) px-3 py-1 text-[11px] font-medium text-(--text-secondary) transition hover:border-(--text-primary) hover:text-(--text-primary)"
                >
                  {alertsLoading ? "Atualizando..." : "Recarregar"}
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              {dashboardAlerts.length === 0 ? (
                <p className="text-(--text-secondary)">Sem alertas relevantes no momento.</p>
              ) : (
                dashboardAlerts.map((alert, index) => (
                  <div key={index} className="rounded-2xl border border-(--border) bg-(--bg-elevated) p-4">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityBadgeColor(alert.prioridade)}`} />
                      <p className="font-medium text-(--text-primary)">{alert.type}</p>
                    </div>
                    <p className="mt-2 text-sm text-(--text-secondary)">{alert.message}</p>
                    <p className="mt-3 text-[11px] text-(--text-muted)">Agora</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
