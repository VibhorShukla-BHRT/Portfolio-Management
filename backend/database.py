import os
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "paper_portfolios.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Portfolios table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        market TEXT NOT NULL, -- 'US' or 'IN'
        currency TEXT NOT NULL, -- '$' or '₹'
        initial_capital REAL NOT NULL,
        cash_balance REAL NOT NULL,
        strategy_mode TEXT DEFAULT 'balanced',
        investment_date TEXT DEFAULT '2026-10-01',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Safe migration: add investment_date if missing
    try:
        cursor.execute("ALTER TABLE portfolios ADD COLUMN investment_date TEXT DEFAULT '2026-10-01'")
    except Exception:
        pass
    
    # Portfolio holdings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        shares REAL NOT NULL,
        buy_price REAL NOT NULL,
        target_weight REAL NOT NULL,
        allocated_cash REAL NOT NULL,
        bought_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
    )
    """)
    
    # Portfolio historical snapshots (for tracking chart over time)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id TEXT NOT NULL,
        total_valuation REAL NOT NULL,
        cash_balance REAL NOT NULL,
        invested_value REAL NOT NULL,
        unrealized_pnl REAL NOT NULL,
        return_pct REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
    )
    """)
    
    # Portfolio transaction history ledger (BUY / SELL orders)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        action TEXT NOT NULL, -- 'BUY' or 'SELL'
        shares REAL NOT NULL,
        price REAL NOT NULL,
        total_value REAL NOT NULL,
        realized_pnl REAL DEFAULT 0.0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
    )
    """)

    # Performance indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_portfolio ON portfolio_snapshots(portfolio_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id)")
    
    conn.commit()
    conn.close()

# Auto-initialize DB on module load
init_db()
