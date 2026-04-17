"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function ProductsPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  const loadProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("O nome do produto é obrigatório.");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("O preço deve ser maior que zero.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category: "Geral",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar produto");
      }

      setName("");
      setPrice("");
      await loadProducts();
      alert("Produto adicionado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar produto");
    }
  };

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-(--text-primary)">Produtos</h1>
        <p className="mt-2 text-(--text-secondary)">Gerencie o cadastro de produtos com estilo escuro premium.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm sm:max-w-xl">
        <input
          type="text"
          placeholder="Nome do produto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) placeholder:text-(--text-faint) focus:border-(--accent) focus:outline-none"
          required
        />
        <input
          type="number"
          placeholder="Preço"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-2xl border border-(--border) bg-(--bg-base) px-4 py-3 text-(--text-primary) placeholder:text-(--text-faint) focus:border-(--accent) focus:outline-none"
          required
        />
        <button className="rounded-2xl bg-(--accent) px-5 py-3 text-sm font-semibold text-(--bg-base) transition hover:brightness-110">
          Adicionar
        </button>
      </form>

      <section className="rounded-3xl border border-(--border) bg-(--bg-elevated) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-primary)">Lista de Produtos</h2>
        <div className="mt-4 divide-y divide-(--border)">
          {products.length === 0 ? (
            <p className="py-6 text-(--text-faint)">Nenhum produto ainda.</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-4 text-(--text-primary)">
                <span>{p.name}</span>
                <span className="text-(--text-secondary)">{p.price} MZN</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}



