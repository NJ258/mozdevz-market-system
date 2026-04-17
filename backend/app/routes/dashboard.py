from collections import defaultdict
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter
from app.routes.alerts import get_alerts
from app.routes.forecast import build_sales_series, predict_demand
from app.db import fetch_all_products, fetch_all_sales, fetch_all_stock, get_total_stock, get_total_sales, get_sales_count, get_weekly_sales_totals

# Rota de dashboard que agrega métricas de produtos, vendas e stock.
router = APIRouter()


def get_sale_product_id(sale: dict) -> Optional[int]:
    return sale.get("product_id") or sale.get("produto_id")


def get_sale_quantity(sale: dict) -> int:
    return int(sale.get("quantidade", sale.get("quantity", 0)))


def parse_sale_datetime(sale: dict) -> Optional[date]:
    raw = sale.get("data_hora") or sale.get("criado_em")
    if not raw:
        return None

    try:
        return date.fromisoformat(raw.split("T")[0])
    except ValueError:
        return None


def get_daily_sales(date_filter: date) -> int:
    sales = fetch_all_sales()
    return sum(
        get_sale_quantity(sale)
        for sale in sales
        if (sale_dt := parse_sale_datetime(sale)) and sale_dt == date_filter
    )


def build_weekly_sales() -> list[dict]:
    today = date.today()
    return [
        {"data": (today - timedelta(days=delta)).isoformat(), "total": get_daily_sales(today - timedelta(days=delta))}
        for delta in range(6, -1, -1)
    ]


@router.get("/dashboard/overview")
async def get_dashboard_overview():
    products = fetch_all_products()
    sales = fetch_all_sales()
    stock = fetch_all_stock()

    total_products = len(products)
    total_sales_quantity = sum(get_sale_quantity(sale) for sale in sales)
    total_stock_quantity = sum(item["quantity"] for item in stock)
    current_stock_quantity = total_stock_quantity - total_sales_quantity
    alerts_count = len(get_alerts())

    return {
        "total_products": total_products,
        "total_sales_quantity": total_sales_quantity,
        "total_stock_quantity": total_stock_quantity,
        "current_stock_quantity": current_stock_quantity,
        "alerts_count": alerts_count,
    }


@router.get("/dashboard/top-products")
async def get_top_products():
    products = fetch_all_products()
    sales = fetch_all_sales()
    product_sales_map = {product["id"]: {"product_id": product["id"], "product_name": product["name"], "total_sold": 0} for product in products}

    for sale in sales:
        product_id = get_sale_product_id(sale)
        quantity = get_sale_quantity(sale)
        if product_id in product_sales_map:
            product_sales_map[product_id]["total_sold"] += quantity

    top_products = list(product_sales_map.values())
    top_products.sort(key=lambda item: item["total_sold"], reverse=True)
    return top_products


@router.get("/dashboard/stock-status")
async def get_stock_status():
    return [
        {
            "product_id": product["id"],
            "product_name": product["name"],
            "total_stock": get_total_stock(product["id"]),
            "total_sales": get_total_sales(product["id"]),
            "current_stock": get_total_stock(product["id"]) - get_total_sales(product["id"]),
            "status": "critical" if get_total_stock(product["id"]) - get_total_sales(product["id"]) <= 0 else "low" if get_total_stock(product["id"]) - get_total_sales(product["id"]) <= 10 else "ok",
        }
        for product in fetch_all_products()
    ]


@router.get("/dashboard/summary")
@router.get("/api/dashboard/resumo")
async def get_dashboard_summary():
    products = fetch_all_products()
    sales = fetch_all_sales()
    stock = fetch_all_stock()

    sales_by_product = defaultdict(int)
    stock_by_product = defaultdict(int)

    for sale in sales:
        product_id = get_sale_product_id(sale)
        if product_id is not None:
            sales_by_product[product_id] += get_sale_quantity(sale)

    for item in stock:
        stock_by_product[item["product_id"]] += item["quantity"]

    alerts_data = await get_alerts()
    stock_status = []
    recommendations = []

    for product in products:
        product_id = product["id"]
        total_stock = stock_by_product[product_id]
        total_sales = sales_by_product[product_id]
        current_stock = total_stock - total_sales
        status = "critical" if current_stock <= 0 else "low" if current_stock <= 10 else "ok"

        stock_status.append({
            "product_id": product_id,
            "product_name": product["name"],
            "total_stock": total_stock,
            "total_sales": total_sales,
            "current_stock": current_stock,
            "status": status,
        })

        sales_series = build_sales_series(product_id)
        predicted_demand = predict_demand(sales_series)
        recommendations.append({
            "product_id": product_id,
            "product_name": product["name"],
            "current_stock": current_stock,
            "predicted_demand": predicted_demand,
            "recommended_purchase": max(0, predicted_demand - current_stock),
        })

    total_stock_quantity = sum(item["quantity"] for item in stock)
    total_sales_quantity = sum(get_sale_quantity(sale) for sale in sales)
    vendas_hoje = get_sales_count(date.today())
    receita_hoje = sum(
        sale.get("total", get_sale_quantity(sale) * sale.get("preco_unitario", 0))
        for sale in sales
        if (sale_dt := parse_sale_datetime(sale)) and sale_dt == date.today()
    )
    produtos_ativos = sum(1 for product in products if get_total_stock(product["id"]) - get_total_sales(product["id"]) > 0)
    vendas_semana = get_weekly_sales_totals()

    return {
        "overview": {
            "total_products": len(products),
            "total_sales_quantity": total_sales_quantity,
            "total_stock_quantity": total_stock_quantity,
            "current_stock_quantity": total_stock_quantity - total_sales_quantity,
            "alerts_count": len(alerts_data),
        },
        "products": products,
        "sales": sales,
        "stock_status": stock_status,
        "recommendations": recommendations,
        "alerts": alerts_data,
        "vendas_hoje": vendas_hoje,
        "receita_hoje": receita_hoje,
        "produtos_ativos": produtos_ativos,
        "vendas_semana": vendas_semana,
    }


@router.get("/dashboard/sales-trend")
async def get_sales_trend():
    return [
        {
            "product_id": product["id"],
            "product_name": product["name"],
            "total_sales": get_total_sales(product["id"]),
        }
        for product in fetch_all_products()
    ]
