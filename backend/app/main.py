from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routes.products import router as products_router
from app.routes.sales import router as sales_router
from app.routes.stock import router as stock_router
from app.routes.forecast import router as forecast_router
from app.routes.alerts import router as alerts_router
from app.routes.dashboard import router as dashboard_router

# Cria a aplicação FastAPI e regista os routers do serviço.
app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(sales_router)
app.include_router(stock_router)
app.include_router(forecast_router)
app.include_router(alerts_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {"message": "API MOZDEVZ a funcionar 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}