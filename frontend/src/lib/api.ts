const API_BASE_URL = "http://127.0.0.1:8000";

// Função utilitária para tratar respostas da API.
async function parseResponse(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Erro na chamada ao backend");
  }
  return response.json();
}

export async function fetchDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function fetchProducts() {
  const response = await fetch(`${API_BASE_URL}/products`, {
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function fetchSales(date: string, limit = 20) {
  const response = await fetch(`${API_BASE_URL}/api/vendas?data=${date}&limit=${limit}`, {
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function fetchAlerts() {
  const response = await fetch(`${API_BASE_URL}/api/alertas`, {
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function createSale(payload: {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  data_hora: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/vendas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
