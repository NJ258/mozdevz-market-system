"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type StockItem = {
  id: number;
  product_id: number;
  quantity: number;
};

const API_BASE_URL = "http://127.0.0.1:8000";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const loadStock = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stock`);
      if (!res.ok) throw new Error("Erro ao buscar stock");
      const data = await res.json();
      setStockItems(data);
    } catch (error) {
      console.error("Erro ao carregar stock:", error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadStock();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!productId) {
      alert("Seleciona um produto.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      alert("A quantidade deve ser maior que zero.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: Number(productId),
          quantity: Number(quantity),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registar stock");
      }

      setProductId("");
      setQuantity("");
      await loadStock();
      alert("Stock registado com sucesso!");
    } catch (error) {
      console.error("Erro ao registar stock:", error);
      alert("Erro ao registar stock");
    }
  };

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-(--text-primary)">Estoque</h1>
        <p className="mt-2 text-(--text-secondary)">Registe reposições de stock e visualize os níveis em tempo real.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm sm:max-w-xl">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
          required
        >
          <option value="">Seleciona um produto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) focus:border-(--accent) focus:outline-none"
          required
        />

        <button className="rounded-2xl bg-(--accent) px-5 py-3 text-sm font-semibold text-(--bg-base) transition hover:brightness-110">
          Adicionar Stock
        </button>
      </form>

      <section className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-primary)">Lista de Stock</h2>
        <div className="mt-4 divide-y divide-(--border)">
          {stockItems.length === 0 ? (
            <p className="py-6 text-(--text-faint)">Nenhum stock registado ainda.</p>
          ) : (
            stockItems.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 py-4 text-(--text-primary)">
                  <span>{product ? product.name : `Produto ${item.product_id}`}</span>
                  <span className="text-(--text-secondary)">Quantidade: {item.quantity}</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}



