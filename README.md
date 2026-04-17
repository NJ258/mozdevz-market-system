# MOZDEVZ Market System

Um sistema de gestão de mercado dividido em duas camadas:

- `backend/`: API REST construída com FastAPI e SQLite.
- `frontend/`: UI web construída com Next.js + React.

## Estrutura do projeto

### backend/

Contém a aplicação de servidor e a base de dados local.

- `app/main.py`
  - Inicializa a aplicação FastAPI.
  - Regista routers de produtos, vendas, estoque, previsão, alertas e dashboard.
  - Configura CORS para permitir o acesso do frontend.

- `app/db.py`
  - Conecta ao SQLite (`database.sqlite`).
  - Cria as tabelas de `products`, `stock` e `sales`.
  - Popula dados iniciais de produtos e estoque.
  - Contém funções de consulta e inserção de dados.

- `app/routes/`
  - `products.py`: endpoints de produtos (`GET /products`, `POST /products`).
  - `sales.py`: endpoints de vendas (`GET /sales`, `POST /sales`, API de vendas em `/api/vendas`).
  - `stock.py`: endpoints de estoque atual e histórico.
  - `dashboard.py`: endpoints de métricas e agregações do dashboard.
  - `forecast.py`: lógica de previsão e recomendações.
  - `alerts.py`: gera alertas automáticos e alertas com IA.

### frontend/

Contém a interface web do sistema.

- `package.json`
  - Scripts de desenvolvimento e build.
  - Dependências do Next.js, React e Tailwind.

- `src/app/`
  - `layout.tsx`: wrapper global da aplicação.
  - `page.tsx`: homepage.
  - `dashboard/page.tsx`: página de dashboard.
  - `products/page.tsx`, `sales/page.tsx`, `stock/page.tsx`, `settings/page.tsx`: páginas de navegação.

- `src/components/`
  - `NavigationShell.tsx`: layout principal com sidebar e header.
  - `HomeDashboard.tsx`: componente do dashboard que consome a API.

- `src/components/ui/`
  - Com componentes reutilizáveis como `Panel`, `MetricCard`, `PageHeader`, `SidebarItem` e `StatusTag`.

- `src/lib/api.ts`
  - Centraliza as chamadas à API do backend.

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

Abra em:

- `http://localhost:3000`

## Integração

- O frontend consome o backend em `http://127.0.0.1:8000`.
- O dashboard usa `/dashboard/summary` para carregar métricas.
- As páginas de produtos, vendas e estoque consomem endpoints específicos do backend.

## Observações

- Execute backend e frontend ao mesmo tempo para a aplicação funcionar.
- Se rodar o backend em outra porta ou host, atualize `API_BASE_URL` em `frontend/src/lib/api.ts`.

## Licença

Este projeto não inclui uma licença específica por padrão.

## Autoria e Colaboração

Este projeto é resultado de uma colaboração com funções bem definidas:

- **NJ258** — niljaneiro258@gmail.com — Co-fundador do projecto
- **arybabe22k** — aristidesguilherme77@gmail.com — Fundador do projecto

