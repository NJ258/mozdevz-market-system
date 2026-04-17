from datetime import date
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator, validator

from app.db import insert_product, fetch_all_products

router = APIRouter()


class ProductCreate(BaseModel):
    """Modelo de validação para criação de produto."""

    name: str = Field(..., min_length=1, description="Nome do produto")
    price: Optional[float] = Field(None, gt=0, description="Preço de venda do produto")
    preco_unitario: Optional[float] = Field(None, gt=0, description="Preço unitário do produto")
    category: str = Field("Geral", min_length=1, description="Categoria do produto")
    stock_minimo: int = Field(5, ge=0, description="Stock mínimo em unidades")
    data_entrada: Optional[str] = Field(None, description="Data de entrada em formato ISO")
    prazo_validade: Optional[str] = Field(None, description="Prazo de validade em formato YYYY-MM-DD")
    dias_validade_padrao: Optional[int] = Field(None, ge=0, description="Dias de validade padrão quando a data real não está definida")

    @model_validator(mode="after")
    def ensure_price_fields(cls, values):
        """Garantir que há pelo menos um preço informado e preencher o par de campos."""
        preco_unitario = values.get("preco_unitario")
        price = values.get("price")

        if preco_unitario is None and price is None:
            raise ValueError("É necessário fornecer price ou preco_unitario.")

        if preco_unitario is None:
            values["preco_unitario"] = price
        if price is None:
            values["price"] = preco_unitario

        return values

    @validator("data_entrada", pre=True, always=True)
    def set_default_data_entrada(cls, value):
        """Define a data de entrada como hoje quando não for informada."""
        return value or date.today().isoformat()


# GET - listar produtos
@router.get("/products")
def get_products():
    return fetch_all_products()


# POST - criar produto com validação de entrada
@router.post("/products")
def create_product(product: ProductCreate):
    created_product = insert_product(product.dict())

    return {
        "message": "Produto criado com sucesso",
        "product": created_product,
    }
