"use client";

import { useEffect, useMemo, useState } from "react";
import { createSale, fetchDashboardSummary, fetchProducts, fetchSales } from "../../lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type SaleItem = {
  id: number;
  product_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  total: number;
  data_hora: string;
  criado_em: string;
};

type Summary = {
  overview: {
    total_products: number;
    total_sales_quantity: number;
    current_stock_quantity: number;
    alerts_count: number;
  };
  products: { id: number; name: string }[];
  sales: { product_id: number; quantity: number }[];
  alerts: { type: string; message: string }[];
};

// Converte a data atual para o valor aceito pelo input datetime-local.
function getLocalDatetimeLocalValue() {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

// Retorna a data de hoje no formato YYYY-MM-DD.
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [dataHora, setDataHora] = useState(getLocalDatetimeLocalValue());
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(productSearch.trim().toLowerCase())
      ),
    [products, productSearch]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number(selectedProductId)),
    [products, selectedProductId]
  );

  const today = useMemo(() => getTodayDate(), []);

  useEffect(() => {
    setPrecoUnitario(selectedProduct?.price.toString() ?? "");
  }, [selectedProduct]);

  useEffect(() => {
    // Carrega os dados iniciais do frontend quando a página monta.
    loadProducts();
    loadSales();
    loadSummary();
  }, []);

  async function loadProducts() {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError((err as Error).message || "Erro ao carregar produtos");
    }
  }

  async function loadSales() {
    try {
      const data = await fetchSales(today, 20);
      setSales(data);
    } catch (err) {
      setError((err as Error).message || "Erro ao carregar vendas");
    }
  }

  async function loadSummary() {
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError((err as Error).message || "Erro ao carregar resumo");
    }
  }

  const salesRows = useMemo(
    () =>
      sales.map((sale) => {
        const product = products.find((item) => item.id === sale.product_id);
        return {
          ...sale,
          productName: product?.name || `Produto ${sale.product_id}`,
        };
      }),
    [sales, products]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId) {
      setError("Seleciona um produto.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }

    if (!precoUnitario || Number(precoUnitario) <= 0) {
      setError("O preço unitário deve ser maior que zero.");
      return;
    }

    try {
      setLoading(true);
      await createSale({
        produto_id: Number(selectedProductId),
        quantidade: Number(quantity),
        preco_unitario: Number(precoUnitario),
        data_hora: new Date(dataHora).toISOString(),
      });
      setSuccess("Venda registada com sucesso!");
      setSelectedProductId("");
      setProductSearch("");
      setQuantity("1");
      setPrecoUnitario("");
      setDataHora(getLocalDatetimeLocalValue());
      await Promise.all([loadSales(), loadSummary()]);
    } catch (err) {
      setError((err as Error).message || "Erro ao registar venda");
    } finally {
      setLoading(false);
    }
  }

  const overview = summary?.overview ?? {
    total_products: 0,
    total_sales_quantity: 0,
    current_stock_quantity: 0,
    alerts_count: 0,
  };

  const alerts = summary?.alerts ?? [];

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-(--text-primary)">Vendas</h1>
      </div>

      {error ? (
        <div className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 text-sm text-(--text-danger)">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 text-sm text-(--text-success)">{success}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium text-(--text-secondary)">Pesquisar produto</label>
            <input
              type="text"
              placeholder="Escreve o nome do produto"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) placeholder:text-(--text-faint) focus:border-(--accent) focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-(--text-secondary)">Produto</label>
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
              required
            >
              <option value="">Seleciona um produto</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-(--text-secondary)">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-(--text-secondary)">Preço unitário</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={precoUnitario}
              onChange={(event) => setPrecoUnitario(event.target.value)}
              className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-(--text-secondary)">Data e hora</label>
            <input
              type="datetime-local"
              value={dataHora}
              onChange={(event) => setDataHora(event.target.value)}
              className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-(--accent) px-5 py-3 text-sm font-semibold text-(--bg-base) transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "A registar..." : "Registar venda"}
          </button>
        </form>

        <div className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-(--text-primary)">Resumo rápido</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--border) bg-(--bg-base) p-4">
              <p className="text-sm text-(--text-faint)">Total produtos</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{overview.total_products}</p>
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--bg-base) p-4">
              <p className="text-sm text-(--text-faint)">Total vendas</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{overview.total_sales_quantity}</p>
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--bg-base) p-4">
              <p className="text-sm text-(--text-faint)">Stock atual</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{overview.current_stock_quantity}</p>
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--bg-base) p-4">
              <p className="text-sm text-(--text-faint)">Alertas</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{overview.alerts_count}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-primary)">Últimas 20 vendas do dia</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-(--text-secondary)">
            <thead>
              <tr className="border-b border-(--border) text-(--text-faint)">
                <th className="py-3 pr-4">Produto</th>
                <th className="py-3 pr-4">Qty</th>
                <th className="py-3 pr-4">Preço unit.</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3">Hora</th>
              </tr>
            </thead>
            <tbody>
              {salesRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-(--text-faint)">Nenhuma venda registada hoje.</td>
                </tr>
              ) : (
                salesRows.map((sale) => (
                  <tr key={sale.id} className="border-b border-(--border)">
                    <td className="py-4 pr-4 text-(--text-primary)">{sale.productName}</td>
                    <td className="py-4 pr-4">{sale.quantidade}</td>
                    <td className="py-4 pr-4">{sale.preco_unitario.toFixed(2)}</td>
                    <td className="py-4 pr-4">{sale.total.toFixed(2)}</td>
                    <td className="py-4 text-(--text-secondary)">{new Date(sale.data_hora).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-primary)">Alertas</h2>
        <div className="mt-4 space-y-3">
          {alerts.length === 0 ? (
            <p className="text-(--text-faint)">Sem alertas no momento.</p>
          ) : (
            alerts.map((alert, index) => (
              <div key={index} className="rounded-3xl border border-(--border) bg-(--bg-base) p-4">
                <p className="font-semibold text-(--text-primary)">{alert.type}</p>
                <p className="mt-2 text-sm text-(--text-secondary)">{alert.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}


