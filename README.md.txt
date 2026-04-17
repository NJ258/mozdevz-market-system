# MOZDEVZ Market System

Um sistema de gestão de mercado dividido em dois blocos principais:

- `backend/`: API REST construída com FastAPI e SQLite.
- `frontend/`: interface web em Next.js + React.

## Estrutura do projeto

### backend/
Contém a aplicação de servidor e a base de dados.

- `app/main.py`
  - Inicializa o servidor FastAPI.
  - Regista routers de produtos, vendas, estoque, forecast, alertas e dashboard.
  - Configura CORS para permitir chamadas do frontend.

- `app/db.py`
  - Conecta ao SQLite (`database.sqlite`).
  - Cria tabelas de `products`, `stock` e `sales`.
  - Fornece funções de acesso aos dados e inserção de registros.
  - Popula dados iniciais de produtos e stock.

- `app/routes/`
  - `products.py`: endpoints `GET /products` e `POST /products`.
  - `sales.py`: endpoints de vendas, incluindo `GET /sales`, `POST /sales` e rotas para `/api/vendas`.
  - `stock.py`: endpoints de estoque e valores atuais.
  - `dashboard.py`: endpoints de dashboard que agregam métricas, status e previsões de vendas.
  - `forecast.py`: lógica de previsão e séries temporais de vendas.
  - `alerts.py`: geração de alertas automáticos e alertas via IA.

### frontend/
Interface web que consome a API.

- `package.json`
  - Scripts de desenvolvimento e build.
  - Dependências: `next`, `react`, `tailwindcss`, `typescript`.

- `src/app/`
  - `layout.tsx`: wrapper global da aplicação.
  - `page.tsx`: página inicial.
  - `dashboard/page.tsx`: página do dashboard.
  - `products/page.tsx`, `sales/page.tsx`, `stock/page.tsx`, `settings/page.tsx`: páginas de navegação.

- `src/components/`
  - `NavigationShell.tsx`: shell de navegação com header, sidebar e links.
  - `HomeDashboard.tsx`: exibe métricas, tabelas e alertas do dashboard.

- `src/components/ui/`
  - Componentes reutilizáveis de interface:
    - `Panel.tsx`
    - `MetricCard.tsx`
    - `PageHeader.tsx`
    - `SidebarItem.tsx`
    - `StatusTag.tsx`

- `src/lib/api.ts`
  - Funções para chamar a API backend:
    - `fetchDashboardSummary()`
    - `fetchProducts()`
    - `fetchSales()`
    - `fetchAlerts()`
    - `createSale()`

## Como executar

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Teste o backend em:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Abra no navegador:

- `http://localhost:3000`

## Como funciona a integração

- O frontend faz requisições para o backend em `http://127.0.0.1:8000`.
- A página de dashboard usa `/dashboard/summary` para carregar métricas.
- As páginas de produtos, vendas e estoque consomem endpoints específicos para exibir dados.

## Dica rápida

- Rodar backend e frontend ao mesmo tempo é obrigatório para o app funcionar.
- Se usar outro host/porta no backend, atualize `API_BASE_URL` em `frontend/src/lib/api.ts`.

## Observações

- O backend persiste dados em `backend/database.sqlite`.
- O frontend é gerado pelo Next.js e usa o shell de navegação para renderizar todas as páginas.
