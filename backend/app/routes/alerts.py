import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from app.db import fetch_all_products, fetch_all_sales, get_total_stock, get_total_sales

# Rota de alertas que combina lógica de stock, validade e recomendações IA.
router = APIRouter()

alert_cache: Dict[str, Any] = {"timestamp": 0.0, "data": []}
IA_CACHE_TTL = 3600.0
alert_id_counter = 1


def get_next_alert_id() -> int:
    global alert_id_counter
    alert_id_counter += 1
    return alert_id_counter


def get_sale_product_id(sale: dict) -> Optional[int]:
    return sale.get("product_id") or sale.get("produto_id")


def get_sale_quantity(sale: dict) -> int:
    return int(sale.get("quantidade", sale.get("quantity", 0)))


def parse_sale_datetime(sale: dict) -> Optional[datetime]:
    raw = sale.get("data_hora") or sale.get("criado_em")
    if not raw:
        return None

    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def get_current_stock(product_id: int) -> int:
    return get_total_stock(product_id) - get_total_sales(product_id)


def build_sales_last_7_days(product_id: int) -> List[int]:
    today = date.today()
    sales = fetch_all_sales()
    sales_by_day = []
    for delta in range(6, -1, -1):
        day = today - timedelta(days=delta)
        sales_by_day.append(
            sum(
                get_sale_quantity(sale)
                for sale in sales
                if get_sale_product_id(sale) == product_id
                and (sale_dt := parse_sale_datetime(sale))
                and sale_dt.date() == day
            )
        )
    return sales_by_day


def get_average_sales_last_7_days(product_id: int) -> float:
    sales = build_sales_last_7_days(product_id)
    return sum(sales) / 7 if sales else 0.0


def parse_product_date(date_value: Optional[str]) -> Optional[date]:
    if not date_value:
        return None

    try:
        return date.fromisoformat(date_value)
    except ValueError:
        return None


def get_estimated_expiry_days(product: dict) -> Optional[int]:
    prazo_validade = parse_product_date(product.get("prazo_validade"))
    if prazo_validade:
        return (prazo_validade - date.today()).days

    data_entrada = parse_product_date(product.get("data_entrada"))
    dias_validade_padrao = product.get("dias_validade_padrao")
    if data_entrada and isinstance(dias_validade_padrao, int):
        return (data_entrada + timedelta(days=dias_validade_padrao) - date.today()).days

    return None


def extract_integer(text: str) -> Optional[int]:
    match = re.search(r"(-?\d+)", text)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def call_anthropic(prompt: str) -> Optional[str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    url = "https://api.anthropic.com/v1/complete"
    body = {
        "model": "claude-3.5-mini",
        "prompt": prompt,
        "max_tokens_to_sample": 150,
        "temperature": 0.1,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
            return data.get("completion") or data.get("output") or data.get("response")
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError):
        return None


def estimate_days_to_exhaust(product: dict, current_stock: int, avg_sales: float) -> Optional[int]:
    if avg_sales <= 0:
        return None

    days = int(round(current_stock / avg_sales)) if avg_sales else None
    if days is not None and days < 7:
        prompt = (
            f"Dado que o produto '{product['name']}' tem {current_stock} unidades em stock "
            f"e vendeu em média {avg_sales:.1f} unidades por dia nos últimos 7 dias, "
            "em quantos dias aproximadamente vai esgotar? Responde apenas com um número inteiro."
        )
        response = call_anthropic(prompt)
        ia_days = extract_integer(response) if response else None
        return ia_days if ia_days is not None else days

    return days


def estimate_validity_with_ia(product: dict) -> Optional[int]:
    prompt = (
        f"Qual é o prazo de validade típico em dias para o produto '{product['name']}' "
        "vendido em mercados informais em Moçambique? Responde apenas com um número inteiro."
    )
    response = call_anthropic(prompt)
    return extract_integer(response) if response else None


def build_alert(
    produto_id: int,
    produto_nome: str,
    tipo: str,
    prioridade: str,
    mensagem: str,
    acao_recomendada: str,
    dias_restantes: Optional[int],
) -> dict:
    return {
        "id": get_next_alert_id(),
        "type": tipo,
        "tipo": tipo,
        "prioridade": prioridade,
        "produto_id": produto_id,
        "produto_nome": produto_nome,
        "message": mensagem,
        "mensagem": mensagem,
        "acao_recomendada": acao_recomendada,
        "recommended_action": acao_recomendada,
        "dias_restantes": dias_restantes,
        "criado_em": datetime.utcnow().isoformat(),
    }


def build_auto_alerts() -> List[dict]:
    alerts: List[dict] = []
    products = fetch_all_products()

    for product in products:
        product_id = product["id"]
        product_name = product["name"]
        stock_minimo = product.get("stock_minimo", 5)
        current_stock = get_current_stock(product_id)
        avg_sales = get_average_sales_last_7_days(product_id)
        dias_para_expirar = get_estimated_expiry_days(product)

        if current_stock <= 0:
            alerts.append(
                build_alert(
                    product_id,
                    product_name,
                    "stock_esgotado",
                    "critica",
                    f"O produto {product_name} está esgotado.",
                    "Registar reposições com urgência.",
                    0,
                )
            )
        elif current_stock <= stock_minimo:
            alerts.append(
                build_alert(
                    product_id,
                    product_name,
                    "stock_baixo",
                    "alta",
                    f"O produto {product_name} está perto do stock mínimo.",
                    "Verifica a quantidade e faz nova encomenda.",
                    current_stock,
                )
            )

        if avg_sales > 0:
            dias_restantes = estimate_days_to_exhaust(product, current_stock, avg_sales)
            if dias_restantes is not None and dias_restantes <= 7:
                prioridade = "critica" if dias_restantes <= 3 else "alta"
                alerts.append(
                    build_alert(
                        product_id,
                        product_name,
                        "previsao_esgotamento",
                        prioridade,
                        f"O stock de {product_name} pode esgotar em aproximadamente {dias_restantes} dias.",
                        "Aumentar reposição ou reduzir vendas dessa referência.",
                        dias_restantes,
                    )
                )

        if dias_para_expirar is not None:
            if dias_para_expirar < 0:
                alerts.append(
                    build_alert(
                        product_id,
                        product_name,
                        "expirado",
                        "critica",
                        f"O produto {product_name} já está expirado.",
                        "Retirar do stock e substituir imediatamente.",
                        dias_para_expirar,
                    )
                )
            elif dias_para_expirar <= 3:
                alerts.append(
                    build_alert(
                        product_id,
                        product_name,
                        "expirando_breve",
                        "critica",
                        f"O produto {product_name} expira em {dias_para_expirar} dias.",
                        "Venda rapidamente ou substitua por outro produto.",
                        dias_para_expirar,
                    )
                )
            elif dias_para_expirar <= 7:
                alerts.append(
                    build_alert(
                        product_id,
                        product_name,
                        "expirando_breve",
                        "alta",
                        f"O produto {product_name} expira em {dias_para_expirar} dias.",
                        "Faz promoções ou reposição rápida.",
                        dias_para_expirar,
                    )
                )
            elif dias_para_expirar <= 14:
                alerts.append(
                    build_alert(
                        product_id,
                        product_name,
                        "expirando_breve",
                        "media",
                        f"O produto {product_name} expira em {dias_para_expirar} dias.",
                        "Fica atento à validade e organiza vendas.",
                        dias_para_expirar,
                    )
                )

    return alerts


def build_ia_recommendations() -> List[dict]:
    global alert_cache
    now = time.time()
    if now - alert_cache["timestamp"] < IA_CACHE_TTL and alert_cache["data"]:
        return alert_cache["data"]

    product_list = []
    products = fetch_all_products()
    for product in products:
        product_id = product["id"]
        product_list.append(
            {
                "name": product["name"],
                "stock_atual": get_current_stock(product_id),
                "dias_para_expirar": get_estimated_expiry_days(product),
                "media_vendas_diaria": round(get_average_sales_last_7_days(product_id), 1),
            }
        )

    prompt = (
        "Analisa estes produtos e diz quais precisam de atenção urgente. "
        "Para cada um indica: nome, problema, ação recomendada. "
        "Responde apenas em JSON com o formato: "
        "[{ produto, problema, acao, prioridade: 'critica'|'alta'|'media' }]. "
        f"Produtos: {json.dumps(product_list, ensure_ascii=False)}"
    )

    response = call_anthropic(prompt)
    if not response:
        return []

    try:
        parsed = json.loads(response)
    except json.JSONDecodeError:
        return []

    result = []
    products = fetch_all_products()
    for item in parsed:
        produto_nome = item.get("produto") or item.get("product") or "Produto"
        problem = item.get("problema") or item.get("problem") or "Atenção necessária"
        acao = item.get("acao") or item.get("action") or "Verificar produto"
        prioridade = item.get("prioridade") or item.get("priority") or "media"

        product = next((p for p in products if p["name"] == produto_nome), None)
        produto_id = product["id"] if product else 0

        result.append(
            build_alert(
                produto_id,
                produto_nome,
                "ia_recomendacao",
                prioridade,
                problem,
                acao,
                None,
            )
        )

    alert_cache = {"timestamp": now, "data": result}
    return result


@router.get("/alerts")
@router.get("/api/alertas")
async def get_alerts() -> List[dict]:
    alerts = build_auto_alerts()
    try:
        alerts += build_ia_recommendations()
    except Exception:
        pass

    priority_order = {"critica": 0, "alta": 1, "media": 2, "info": 3}
    return sorted(alerts, key=lambda item: priority_order.get(item.get("prioridade", "media"), 2))


@router.get("/api/alertas/ia")
async def get_alerts_ia() -> List[dict]:
    try:
        return build_ia_recommendations()
    except Exception:
        return []
