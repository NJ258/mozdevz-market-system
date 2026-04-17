from datetime import datetime
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field, validator

from app.db import insert_stock, fetch_all_stock, get_total_stock, get_total_sales

router = APIRouter()


class StockCreate(BaseModel):
    """Modelo de validação para registo de stock."""

    product_id: int = Field(..., gt=0, description="ID do produto no stock")
    quantity: int = Field(..., gt=0, description="Quantidade a registar no stock")
    created_at: Optional[str] = Field(None, description="Data de criação do registo de stock em ISO")

    @validator("created_at", pre=True, always=True)
    def set_default_created_at(cls, value):
        """Define a data de criação quando não for informada."""
        return value or datetime.utcnow().isoformat()


# POST - registar stock com validação
@router.post("/stock")
def create_stock(stock: StockCreate):
    created_stock = insert_stock(stock.dict())
    return {
        "message": "Stock registado com sucesso",
        "stock": created_stock,
    }


# GET - listar todo o stock
@router.get("/stock")
def get_stock():
    return fetch_all_stock()


# GET - stock atual por produto, considerando vendas realizadas
@router.get("/stock/current")
def get_current_stock():
    products_stock = {}

    for stock_item in fetch_all_stock():
        product_id = stock_item["product_id"]
        quantity = stock_item["quantity"]
        products_stock[product_id] = products_stock.get(product_id, 0) + quantity

    for product_id in list(products_stock.keys()):
        products_stock[product_id] -= get_total_sales(product_id)

    return products_stock
