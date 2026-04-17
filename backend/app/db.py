import os
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

# Base directory do backend e caminho para o ficheiro SQLite.
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "database.sqlite"

DEFAULT_PRODUCTS = [
    {
        "name": "Tomate",
        "price": 50,
        "preco_unitario": 50,
        "category": "Hortícolas",
        "stock_minimo": 5,
        "data_entrada": date(2026, 4, 1).isoformat(),
        "prazo_validade": date(2026, 5, 1).isoformat(),
        "dias_validade_padrao": 30,
    },
    {
        "name": "Cebola",
        "price": 40,
        "preco_unitario": 40,
        "category": "Hortícolas",
        "stock_minimo": 5,
        "data_entrada": date(2026, 4, 2).isoformat(),
        "prazo_validade": None,
        "dias_validade_padrao": 30,
    },
]

DEFAULT_STOCK = [
    {"product_id": 1, "quantity": 100},
    {"product_id": 2, "quantity": 80},
]


def dict_factory(cursor: sqlite3.Cursor, row: sqlite3.Row) -> Dict[str, Any]:
    """Retorna linhas SQLite como dicionários."""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def get_connection() -> sqlite3.Connection:
    """Cria e devolve uma ligação SQLite para o ficheiro local."""
    os.makedirs(DB_PATH.parent, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = dict_factory
    return connection


def execute(sql: str, params: Iterable[Any] = ()) -> int:
    """Executa um comando SQL e devolve o último ID inserido."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        conn.commit()
        return cursor.lastrowid


def query_all(sql: str, params: Iterable[Any] = ()) -> List[Dict[str, Any]]:
    """Executa uma consulta SQL que retorna várias linhas."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        return cursor.fetchall()


def query_one(sql: str, params: Iterable[Any] = ()) -> Optional[Dict[str, Any]]:
    """Executa uma consulta SQL que retorna uma única linha."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        return cursor.fetchone()


def init_db() -> None:
    """Cria as tabelas se não existirem e adiciona dados padrão."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                preco_unitario REAL NOT NULL,
                category TEXT NOT NULL,
                stock_minimo INTEGER NOT NULL,
                data_entrada TEXT,
                prazo_validade TEXT,
                dias_validade_padrao INTEGER
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                preco_unitario REAL NOT NULL,
                total REAL NOT NULL,
                data_hora TEXT NOT NULL,
                criado_em TEXT NOT NULL,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
            """
        )
        conn.commit()

    if not query_one("SELECT 1 FROM products LIMIT 1"):
        for product in DEFAULT_PRODUCTS:
            insert_product(product)

    if not query_one("SELECT 1 FROM stock LIMIT 1"):
        for stock in DEFAULT_STOCK:
            insert_stock(stock)


def insert_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """Insere um produto novo na tabela products."""
    sql = """
        INSERT INTO products
            (name, price, preco_unitario, category, stock_minimo, data_entrada, prazo_validade, dias_validade_padrao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    product_id = execute(
        sql,
        [
            product["name"],
            product.get("price", product.get("preco_unitario", 0)),
            product.get("preco_unitario", product.get("price", 0)),
            product.get("category", "Geral"),
            product.get("stock_minimo", 5),
            product.get("data_entrada"),
            product.get("prazo_validade"),
            product.get("dias_validade_padrao"),
        ],
    )
    return get_product_by_id(product_id)


def insert_stock(stock: Dict[str, Any]) -> Dict[str, Any]:
    """Insere um registo de stock para um produto."""
    sql = "INSERT INTO stock (product_id, quantity, created_at) VALUES (?, ?, ?)"
    stock_id = execute(sql, [stock["product_id"], stock["quantity"], stock.get("created_at", datetime.utcnow().isoformat())])
    return get_stock_by_id(stock_id)


def insert_sale(sale: Dict[str, Any]) -> Dict[str, Any]:
    """Insere uma venda na tabela sales."""
    sql = """
        INSERT INTO sales
            (product_id, quantity, preco_unitario, total, data_hora, criado_em)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    sale_id = execute(
        sql,
        [
            sale["product_id"],
            sale["quantity"],
            sale["preco_unitario"],
            sale["total"],
            sale["data_hora"],
            sale["criado_em"],
        ],
    )
    return get_sale_by_id(sale_id)


def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
    return query_one("SELECT * FROM products WHERE id = ?", [product_id])


def get_stock_by_id(stock_id: int) -> Optional[Dict[str, Any]]:
    return query_one("SELECT * FROM stock WHERE id = ?", [stock_id])


def get_sale_by_id(sale_id: int) -> Optional[Dict[str, Any]]:
    return query_one("SELECT * FROM sales WHERE id = ?", [sale_id])


def fetch_all_products() -> List[Dict[str, Any]]:
    """Obtém todos os produtos registados."""
    return query_all("SELECT * FROM products ORDER BY id")


def fetch_all_stock() -> List[Dict[str, Any]]:
    """Obtém todos os registos de stock."""
    return query_all("SELECT * FROM stock ORDER BY id")


def fetch_all_sales() -> List[Dict[str, Any]]:
    """Obtém todas as vendas registadas."""
    return query_all("SELECT * FROM sales ORDER BY id")


def get_total_stock(product_id: int) -> int:
    """Soma o stock disponível para um produto."""
    row = query_one("SELECT COALESCE(SUM(quantity), 0) AS total FROM stock WHERE product_id = ?", [product_id])
    return int(row["total"] if row else 0)


def get_total_sales(product_id: int) -> int:
    """Soma a quantidade vendida de um produto."""
    row = query_one("SELECT COALESCE(SUM(quantity), 0) AS total FROM sales WHERE product_id = ?", [product_id])
    return int(row["total"] if row else 0)


def get_current_stock(product_id: int) -> int:
    """Retorna stock atual descontando as vendas do total em stock."""
    return get_total_stock(product_id) - get_total_sales(product_id)


def get_sales_by_date(date_filter: date, limit: int = 20) -> List[Dict[str, Any]]:
    """Busca vendas por data específica."""
    return query_all(
        "SELECT * FROM sales WHERE date(data_hora) = ? ORDER BY datetime(data_hora) DESC LIMIT ?",
        [date_filter.isoformat(), limit],
    )


def get_sales_count(date_filter: date) -> int:
    """Conta o número de vendas em um dia."""
    row = query_one(
        "SELECT COUNT(*) AS count FROM sales WHERE date(data_hora) = ?",
        [date_filter.isoformat()],
    )
    return int(row["count"] if row else 0)


def get_sales_series(product_id: int) -> List[int]:
    """Retorna um histórico de quantidades vendidas por produto."""
    rows = query_all(
        "SELECT quantity FROM sales WHERE product_id = ? ORDER BY datetime(data_hora) ASC",
        [product_id],
    )
    return [row["quantity"] for row in rows]


def get_sales_total_by_product_and_date(product_id: int, date_filter: date) -> int:
    """Total de vendas para um produto em uma data dada."""
    row = query_one(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM sales WHERE product_id = ? AND date(data_hora) = ?",
        [product_id, date_filter.isoformat()],
    )
    return int(row["total"] if row else 0)


def get_weekly_sales_totals() -> List[Dict[str, Any]]:
    """Gera uma lista de vendas totais dos últimos 7 dias."""
    today = date.today()
    results = []
    for delta in range(6, -1, -1):
        day = today - timedelta(days=delta)
        row = query_one(
            "SELECT COALESCE(SUM(quantity), 0) AS total FROM sales WHERE date(data_hora) = ?",
            [day.isoformat()],
        )
        results.append({"data": day.isoformat(), "total": int(row["total"] if row else 0)})
    return results
