from fastapi import APIRouter
from app.db import fetch_all_products, fetch_all_sales, get_total_stock, get_total_sales

# Rota de previsão simples baseada em média de vendas recentes.
router = APIRouter()


def build_sales_series(product_id: int) -> tuple[int, ...]:
    sales = fetch_all_sales()
    return tuple(sale["quantity"] for sale in sales if sale["product_id"] == product_id)


def predict_demand(sales_series: tuple[int, ...]) -> int:
    if not sales_series:
        return 0

    recent_sales = sales_series[-7:]
    average_sales = sum(recent_sales) / len(recent_sales)
    return max(0, int(round(average_sales)))


@router.get("/forecast/recommendation")
def get_recommendation():
    recommendations = []

    for product in fetch_all_products():
        product_id = product["id"]
        current_stock = get_total_stock(product_id) - get_total_sales(product_id)
        sales_series = build_sales_series(product_id)
        predicted_demand = predict_demand(sales_series)
        recommended_purchase = max(0, predicted_demand - current_stock)

        recommendations.append({
            "product_id": product_id,
            "product_name": product["name"],
            "current_stock": current_stock,
            "predicted_demand": predicted_demand,
            "recommended_purchase": recommended_purchase,
        })

    return recommendations
