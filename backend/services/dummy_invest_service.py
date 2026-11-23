import uuid
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pytz
import pandas as pd
import yfinance as yf

from backend.database import get_connection
from backend.services.market_service import get_quote, get_batch_quotes

def _get_time_strings(iso_str: str, market: str) -> Dict[str, str]:
    """Converts ISO timestamp string to explicit IST and Market local times."""
    try:
        dt = datetime.fromisoformat(iso_str)
        ist_tz = pytz.timezone("Asia/Kolkata")
        edt_tz = pytz.timezone("America/New_York")
        
        dt_ist = ist_tz.localize(dt) if dt.tzinfo is None else dt.astimezone(ist_tz)
        dt_edt = dt_ist.astimezone(edt_tz)
        
        time_ist = dt_ist.strftime("%d %b, %I:%M %p IST")
        time_edt = dt_edt.strftime("%d %b, %I:%M %p EDT")
        
        display_label = dt_ist.strftime("%b %d, %I:%M %p")
        return {
            "label": display_label,
            "time_ist": time_ist,
            "time_edt": time_edt,
            "display_market_time": time_edt if market == "US" else time_ist
        }
    except Exception:
        return {
            "label": iso_str[:16].replace("T", " "),
            "time_ist": iso_str[:16].replace("T", " "),
            "time_edt": iso_str[:16].replace("T", " "),
            "display_market_time": iso_str[:16].replace("T", " ")
        }

def _get_historical_trajectory(
    holdings_dict: Dict[str, float],
    cash_balance: float,
    market: str,
    timeframe: str,
    investment_date: Optional[str] = None,
    initial_capital: float = 0.0
) -> List[Dict[str, Any]]:
    """
    Computes historical portfolio valuation and benchmark performance.
    STRICTLY bounded by the user's investment date so the X-axis
    never shows misleading pre-investment dates.
    """
    tickers = list(holdings_dict.keys())
    if not tickers:
        return []
        
    benchmark_sym = "^NSEI" if market == "IN" else "^GSPC"
    now_dt = pd.to_datetime(datetime.now())
    inv_date_str = (investment_date.strip() if investment_date and str(investment_date).strip() else None) or datetime.now().strftime("%Y-%m-%d")
    try:
        inv_dt = pd.to_datetime(inv_date_str)
    except Exception:
        inv_dt = now_dt
    
    clean_tf = timeframe.upper().strip()
    all_syms = tickers + [benchmark_sym]
    
    if clean_tf == "1D":
        try:
            raw = yf.download(all_syms, period="1d", interval="5m", progress=False)["Close"]
            if raw.empty:
                # If market not open yet today, grab latest 1-day session
                raw = yf.download(all_syms, period="5d", interval="15m", progress=False)["Close"]
                if not raw.empty:
                    # Filter to last trading date
                    last_day = raw.index[-1].date()
                    raw = raw[raw.index.date == last_day]
            if not raw.empty:
                data = raw.dropna(how="all").ffill().bfill()
                points = []
                base_val = None
                base_bm = None
                for dt, row in data.iterrows():
                    val = cash_balance + sum(
                        holdings_dict[t] * float(row[t]) for t in tickers if t in row and pd.notnull(row[t])
                    )
                    bm_price = float(row[benchmark_sym]) if benchmark_sym in row and pd.notnull(row[benchmark_sym]) else 1.0
                    if base_val is None:
                        base_val = val
                    if base_bm is None:
                        base_bm = bm_price
                    ret_pct = round(((val - base_val) / base_val) * 100, 2) if base_val else 0.0
                    bm_ret_pct = round(((bm_price - base_bm) / base_bm) * 100, 2) if base_bm else 0.0
                    
                    time_label = dt.strftime("%I:%M %p")
                    full_display = f"{dt.strftime('%b %d, %Y')} • {time_label} ({market})"
                    points.append({
                        "label": time_label,
                        "date_iso": dt.isoformat(),
                        "display_market_time": full_display,
                        "time_ist": dt.tz_convert("Asia/Kolkata").strftime("%I:%M %p IST") if hasattr(dt, "tz_convert") and dt.tzinfo else time_label,
                        "time_edt": dt.tz_convert("America/New_York").strftime("%I:%M %p EDT") if hasattr(dt, "tz_convert") and dt.tzinfo else time_label,
                        "total_valuation": round(val, 2),
                        "return_pct": ret_pct,
                        "benchmark_return_pct": bm_ret_pct
                    })
                return points
        except Exception:
            pass

    # Standard multi-day/year portfolio mode: strictly bounded by investment date!
    is_pre_investment_backtest = clean_tf.startswith("BACKTEST_")
    
    if is_pre_investment_backtest:
        if "5Y" in clean_tf:
            start_dt = now_dt - pd.DateOffset(years=5)
            interval = "1wk"
        else:
            start_dt = now_dt - pd.DateOffset(years=1)
            interval = "1d"
    else:
        # Standard portfolio mode: strictly bounded by investment date!
        if clean_tf == "1W":
            start_dt = max(now_dt - pd.DateOffset(days=7), inv_dt)
        elif clean_tf == "1M":
            start_dt = max(now_dt - pd.DateOffset(days=30), inv_dt)
        else:
            # 1Y, 5Y, ALL: Clamped strictly to the investment date!
            start_dt = inv_dt
        start_dt = max(start_dt, inv_dt)
        interval = "1d"
        
    try:
        raw = yf.download(all_syms, start=start_dt.strftime("%Y-%m-%d"), interval=interval, progress=False)["Close"]
        if raw.empty:
            return []
        data = raw.dropna(how="all").ffill().bfill()
        if hasattr(data.index, "tz") and data.index.tz is not None:
            data.index = data.index.tz_localize(None)
        start_filter = start_dt.tz_localize(None) if hasattr(start_dt, "tz") and start_dt.tz is not None else start_dt
        data = data[data.index >= start_filter]
        if not is_pre_investment_backtest:
            inv_filter = inv_dt.tz_localize(None) if hasattr(inv_dt, "tz") and inv_dt.tz is not None else inv_dt
            data = data[data.index >= inv_filter]
    except Exception:
        return []
        
    points = []
    base_val = None
    base_bm = None
    
    for date, row in data.iterrows():
        val = cash_balance + sum(
            holdings_dict[t] * float(row[t]) for t in tickers if t in row and pd.notnull(row[t])
        )
        bm_price = float(row[benchmark_sym]) if benchmark_sym in row and pd.notnull(row[benchmark_sym]) else 1.0
        
        if base_val is None:
            base_val = initial_capital if (initial_capital > 0 and not is_pre_investment_backtest) else val
        if base_bm is None:
            base_bm = bm_price
            
        ret_pct = round(((val - base_val) / base_val) * 100, 2) if base_val else 0.0
        bm_ret_pct = round(((bm_price - base_bm) / base_bm) * 100, 2) if base_bm else 0.0
        
        date_str = date.strftime("%b %d, %Y") if is_pre_investment_backtest else date.strftime("%b %d")
        
        points.append({
            "label": date_str,
            "date_iso": date.strftime("%Y-%m-%d"),
            "display_market_time": date.strftime("%b %d, %Y"),
            "total_valuation": round(val, 2),
            "return_pct": ret_pct,
            "benchmark_return_pct": bm_ret_pct
        })
    return points

def create_paper_portfolio(
    name: str,
    market: str,
    currency: str,
    initial_capital: float,
    holdings: List[Dict[str, Any]],
    strategy_mode: str = "balanced",
    investment_date: Optional[str] = None
) -> Dict[str, Any]:
    """Creates a new dummy investment paper portfolio in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    
    portfolio_id = str(uuid.uuid4())[:8]
    invested_cash = sum(float(h.get("allocated_cash", 0.0)) for h in holdings)
    cash_balance = max(0.0, initial_capital - invested_cash)
    now_iso = datetime.now().isoformat()
    inv_date = (investment_date.strip() if investment_date and str(investment_date).strip() else None) or datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute("""
    INSERT INTO portfolios (id, name, market, currency, initial_capital, cash_balance, strategy_mode, investment_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        portfolio_id,
        name,
        market.upper(),
        currency,
        initial_capital,
        cash_balance,
        strategy_mode,
        inv_date,
        now_iso,
        now_iso
    ))
    
    for h in holdings:
        h_ticker = h.get("ticker", "").strip().upper()
        h_shares = float(h.get("shares", 0))
        h_price = float(h.get("price", h.get("buy_price", 0.0)))
        h_weight = float(h.get("target_weight", 0.0))
        h_alloc = float(h.get("allocated_cash", 0.0))
        if h_alloc == 0.0 and h_shares > 0 and h_price > 0:
            h_alloc = round(h_shares * h_price, 2)
            
        cursor.execute("""
        INSERT INTO holdings (portfolio_id, ticker, shares, buy_price, target_weight, allocated_cash, bought_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            portfolio_id,
            h_ticker,
            h_shares,
            h_price,
            h_weight,
            h_alloc,
            inv_date
        ))

        # Record BUY in transaction history ledger
        if h_shares > 0:
            cursor.execute("""
            INSERT INTO transactions (portfolio_id, ticker, action, shares, price, total_value, realized_pnl, timestamp)
            VALUES (?, ?, 'BUY', ?, ?, ?, 0.0, ?)
            """, (
                portfolio_id,
                h_ticker,
                h_shares,
                h_price,
                round(h_alloc, 2),
                f"{inv_date}T09:30:00"
            ))
        
    # Record initial snapshot
    cursor.execute("""
    INSERT INTO portfolio_snapshots (portfolio_id, total_valuation, cash_balance, invested_value, unrealized_pnl, return_pct, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        portfolio_id,
        initial_capital,
        cash_balance,
        invested_cash,
        0.0,
        0.0,
        f"{inv_date}T09:30:00"
    ))
    
    conn.commit()
    conn.close()
    
    return get_paper_portfolio_tracking(portfolio_id, timeframe="ALL")

def update_paper_portfolio_investment_date(portfolio_id: str, new_date: str) -> bool:
    """Updates the investment date for an existing portfolio."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE portfolios 
    SET investment_date = ?, updated_at = ?
    WHERE id = ?
    """, (new_date, datetime.now().isoformat(), portfolio_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def list_paper_portfolios() -> List[Dict[str, Any]]:
    """Lists all paper portfolios with quick summary metrics."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM portfolios ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    results = []
    for r in rows:
        results.append(dict(r))
    conn.close()
    return results

def get_paper_portfolio_tracking(portfolio_id: str, timeframe: str = "ALL") -> Dict[str, Any]:
    """
    Calculates live mark-to-market performance of a paper portfolio using live market prices.
    STRICTLY bounds history by the portfolio's investment_date so the X-axis always begins
    when the user actually invested (e.g., Oct 2026).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM portfolios WHERE id = ?", (portfolio_id,))
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        return {"error": "Portfolio not found."}
        
    portfolio = dict(p_row)
    market = portfolio["market"]
    currency = portfolio["currency"]
    inv_date = portfolio.get("investment_date") or datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute("SELECT * FROM holdings WHERE portfolio_id = ?", (portfolio_id,))
    h_rows = cursor.fetchall()
    
    holdings_data = []
    holdings_dict = {}
    total_current_invested = 0.0
    total_initial_cost = 0.0
    day_pnl = 0.0
    
    for row in h_rows:
        h = dict(row)
        ticker = h["ticker"]
        shares = float(h["shares"])
        buy_price = float(h["buy_price"])
        holdings_dict[ticker] = shares
        
        quote = get_quote(ticker)
        live_price = quote.get("price", buy_price)
        prev_close = quote.get("prev_close", live_price)
        
        current_val = shares * live_price
        initial_val = shares * buy_price
        unrealized_pnl = current_val - initial_val
        pnl_pct = ((live_price - buy_price) / buy_price * 100) if buy_price > 0 else 0.0
        
        holding_day_pnl = shares * (live_price - prev_close)
        day_pnl += holding_day_pnl
        
        total_current_invested += current_val
        total_initial_cost += initial_val
        
        holdings_data.append({
            "ticker": ticker,
            "name": quote.get("name", ticker),
            "shares": shares,
            "buy_price": round(buy_price, 2),
            "live_price": round(live_price, 2),
            "current_value": round(current_val, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "day_change_pct": round(quote.get("change_pct", 0.0), 2),
            "currency": currency
        })
        
    cash_balance = float(portfolio["cash_balance"])
    total_valuation = round(cash_balance + total_current_invested, 2)
    initial_cap = float(portfolio["initial_capital"])
    total_pnl = round(total_valuation - initial_cap, 2)
    total_return_pct = round((total_pnl / initial_cap * 100), 2) if initial_cap > 0 else 0.0
    
    # Snapshot Throttling: Check if last snapshot was created within last 15 mins
    cursor.execute("SELECT id, timestamp FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY id DESC LIMIT 1", (portfolio_id,))
    last_snap = cursor.fetchone()
    now_iso = datetime.now().isoformat()
    
    should_insert_new = True
    if last_snap:
        try:
            last_dt = datetime.fromisoformat(last_snap["timestamp"])
            if (datetime.now() - last_dt).total_seconds() < 900:  # 15 minutes
                cursor.execute("""
                UPDATE portfolio_snapshots 
                SET total_valuation = ?, cash_balance = ?, invested_value = ?, unrealized_pnl = ?, return_pct = ?, timestamp = ?
                WHERE id = ?
                """, (total_valuation, cash_balance, total_current_invested, total_pnl, total_return_pct, now_iso, last_snap["id"]))
                should_insert_new = False
        except Exception:
            pass

    if should_insert_new:
        cursor.execute("""
        INSERT INTO portfolio_snapshots (portfolio_id, total_valuation, cash_balance, invested_value, unrealized_pnl, return_pct, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (portfolio_id, total_valuation, cash_balance, total_current_invested, total_pnl, total_return_pct, now_iso))
    conn.commit()
    
    # Compute history bounded by investment date
    history_points = _get_historical_trajectory(
        holdings_dict=holdings_dict,
        cash_balance=cash_balance,
        market=market,
        timeframe=timeframe,
        investment_date=inv_date,
        initial_capital=initial_cap
    )
    
    # If historical download returned empty, fallback to DB recorded snapshots
    if not history_points:
        cursor.execute("SELECT total_valuation, return_pct, timestamp FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY id ASC LIMIT 100", (portfolio_id,))
        raw_snapshots = cursor.fetchall()
        
        for s in raw_snapshots:
            s_dict = dict(s)
            t_info = _get_time_strings(s_dict["timestamp"], market)
            history_points.append({
                "label": t_info["label"],
                "date_iso": s_dict["timestamp"],
                "display_market_time": t_info["display_market_time"],
                "time_ist": t_info["time_ist"],
                "time_edt": t_info["time_edt"],
                "total_valuation": round(s_dict["total_valuation"], 2),
                "return_pct": round(s_dict["return_pct"], 2),
                "benchmark_return_pct": 0.0
            })
            
    if len(history_points) == 1:
        t_info = _get_time_strings(now_iso, market)
        history_points.append({
            "label": t_info["label"],
            "date_iso": now_iso,
            "display_market_time": t_info["display_market_time"],
            "time_ist": t_info["time_ist"],
            "time_edt": t_info["time_edt"],
            "total_valuation": round(total_valuation, 2),
            "return_pct": round(total_return_pct, 2),
            "benchmark_return_pct": 0.0
        })

    conn.close()
    
    # Benchmark index performance comparison
    benchmark_symbol = "^NSEI" if market == "IN" else "^GSPC"
    benchmark_name = "NIFTY 50" if market == "IN" else "S&P 500"
    b_quote = get_quote(benchmark_symbol)
    
    # Timezone details for clear display
    tz_info = {
        "market": market,
        "exchange_name": "NSE / BSE (Mumbai)" if market == "IN" else "NYSE / NASDAQ (New York)",
        "exchange_timezone": "IST (UTC+5:30)" if market == "IN" else "EDT (UTC-4:00)",
        "market_hours": "09:15 AM - 03:30 PM IST" if market == "IN" else "09:30 AM - 04:00 PM EDT",
        "user_timezone": "IST (India Standard Time)",
        "investment_date": inv_date
    }
    
    return {
        "portfolio": portfolio,
        "timeframe": timeframe.upper().strip(),
        "timezone_info": tz_info,
        "summary": {
            "initial_capital": initial_cap,
            "cash_balance": round(cash_balance, 2),
            "invested_value": round(total_current_invested, 2),
            "total_valuation": total_valuation,
            "total_pnl": total_pnl,
            "total_return_pct": total_return_pct,
            "day_pnl": round(day_pnl, 2),
            "currency": currency,
            "benchmark": {
                "name": benchmark_name,
                "symbol": benchmark_symbol,
                "day_change_pct": round(b_quote.get("change_pct", 0.0), 2)
            }
        },
        "holdings": holdings_data,
        "history": history_points
    }

def sell_holding(portfolio_id: str, ticker: str, shares_to_sell: float) -> Dict[str, Any]:
    """
    Sells (partially or fully) a holding from a paper portfolio:
    1. Looks up holding and current live market price
    2. Computes sell value and realized P&L
    3. Decrements shares (or deletes holding if fully liquidated)
    4. Adds proceeds back to portfolio cash_balance
    5. Records SELL transaction in the ledger
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM portfolios WHERE id = ?", (portfolio_id,))
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        return {"error": "Portfolio not found."}
        
    portfolio = dict(p_row)
    currency = portfolio["currency"]
    ticker = ticker.strip().upper()
    
    cursor.execute("SELECT * FROM holdings WHERE portfolio_id = ? AND ticker = ?", (portfolio_id, ticker))
    h_row = cursor.fetchone()
    if not h_row:
        conn.close()
        return {"error": f"Holding {ticker} not found in this portfolio."}
        
    holding = dict(h_row)
    current_shares = float(holding["shares"])
    buy_price = float(holding["buy_price"])
    
    if shares_to_sell <= 0:
        conn.close()
        return {"error": "Shares to sell must be greater than zero."}
        
    if shares_to_sell > current_shares:
        conn.close()
        return {"error": f"Cannot sell {shares_to_sell} shares; only {current_shares} owned."}
        
    quote = get_quote(ticker)
    sell_price = quote.get("price", buy_price)
    sell_value = round(shares_to_sell * sell_price, 2)
    cost_basis = round(shares_to_sell * buy_price, 2)
    realized_pnl = round(sell_value - cost_basis, 2)
    
    remaining_shares = round(current_shares - shares_to_sell, 4)
    now_iso = datetime.now().isoformat()
    
    if remaining_shares < 0.0001:
        # Full liquidation — delete row
        cursor.execute("DELETE FROM holdings WHERE id = ?", (holding["id"],))
        remaining_shares = 0.0
    else:
        new_allocated = round(remaining_shares * buy_price, 2)
        cursor.execute(
            "UPDATE holdings SET shares = ?, allocated_cash = ? WHERE id = ?",
            (remaining_shares, new_allocated, holding["id"])
        )
        
    # Credit cash balance
    new_cash = round(float(portfolio["cash_balance"]) + sell_value, 2)
    cursor.execute(
        "UPDATE portfolios SET cash_balance = ?, updated_at = ? WHERE id = ?",
        (new_cash, now_iso, portfolio_id)
    )
    
    # Record transaction in ledger
    cursor.execute("""
    INSERT INTO transactions (portfolio_id, ticker, action, shares, price, total_value, realized_pnl, timestamp)
    VALUES (?, ?, 'SELL', ?, ?, ?, ?, ?)
    """, (
        portfolio_id,
        ticker,
        shares_to_sell,
        sell_price,
        sell_value,
        realized_pnl,
        now_iso
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "ticker": ticker,
        "shares_sold": shares_to_sell,
        "sell_price": sell_price,
        "sell_value": sell_value,
        "realized_pnl": realized_pnl,
        "remaining_shares": remaining_shares,
        "new_cash_balance": new_cash,
        "currency": currency,
        "message": f"Sold {shares_to_sell} shares of {ticker} @ {currency}{sell_price:.2f} for {currency}{sell_value:,.2f}"
    }

def get_portfolio_transactions(portfolio_id: str) -> List[Dict[str, Any]]:
    """Returns all transactions for a paper portfolio."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM transactions WHERE portfolio_id = ? ORDER BY timestamp DESC, id DESC",
        (portfolio_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_paper_portfolio(portfolio_id: str) -> bool:
    """Deletes a paper portfolio and its holdings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE portfolio_id = ?", (portfolio_id,))
    cursor.execute("DELETE FROM holdings WHERE portfolio_id = ?", (portfolio_id,))
    cursor.execute("DELETE FROM portfolio_snapshots WHERE portfolio_id = ?", (portfolio_id,))
    cursor.execute("DELETE FROM portfolios WHERE id = ?", (portfolio_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
