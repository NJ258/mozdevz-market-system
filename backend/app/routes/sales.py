from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.db import insert_sale, get_product_by_id, get_sales_by_date, get_total_stock, get_total_sales

router = APIRouter()


def get_sale_product_id(sale: dict) -> Optional[int]:
    """Retorna o ID do produto de um registo de venda."""
    return sale.get("product_id") or sale.get("produto_id")


def get_sale_quantity(sale: dict) -> int:
    """Normaliza a quantidade de venda para compatibilidade com vários formatos."""
    return int(sale.get("quantidade", sale.get("quantity", 0)))


def parse_sale_datetime(sale: dict) -> Optional[datetime]:
    """Converte a data/hora da venda de string ISO para datetime."""
    raw = sale.get("data_hora") or sale.get("criado_em")
    if not raw:
        return None

    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


class SaleCreate(BaseModel):
    """Modelo de validação para registos de venda."""

    produto_id: int = Field(..., gt=0, description="ID do produto vendido")
    quantidade: int = Field(..., gt=0, description="Quantidade vendida")
    preco_unitario: float = Field(..., gt=0, description="Preço unitário da venda")
    data_hora: Optional[datetime] = Field(None, description="Data e hora da venda")


@router.post("/sales")
@router.post("/api/vendas")
async def create_sale(sale: SaleCreate):
    """Regista uma venda no sistema e devolve o stock atualizado."""
    product = get_product_by_id(sale.produto_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    total = sale.preco_unitario * sale.quantidade
    data_hora = sale.data_hora or datetime.utcnow()
    criado_em = datetime.utcnow()

    sale_record = {
        "product_id": sale.produto_id,
        "quantity": sale.quantidade,
        "preco_unitario": sale.preco_unitario,
        "total": total,
        "data_hora": data_hora.isoformat(),
        "criado_em": criado_em.isoformat(),
    }

    inserted_sale = insert_sale(sale_record)

    return {
        "message": "Venda registada com sucesso",
        "sale": inserted_sale,
        "novo_stock": get_total_stock(sale.produto_id) - get_total_sales(sale.produto_id),
    }


def parse_query_date(date_str: Optional[str]) -> date:
    """Valida a data de consulta e converte para date."""
    if not date_str:
        return date.today()

    try:
        return date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM-DD")


@router.get("/sales")
@router.get("/api/vendas")
async def get_sales(data: Optional[str] = Query(None), limit: int = Query(20, gt=0)):
    """Retorna vendas filtradas por data e limite."""
    date_filter = parse_query_date(data)
    return get_sales_by_date(date_filter, limit)
