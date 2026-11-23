import time
import math
from typing import Dict, List, Any, Optional
import yfinance as yf
import pandas as pd

# In-memory quote cache (ticker -> (timestamp, data))
_QUOTE_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 60

# Predefined institutional stock universes
CURATED_UNIVERSES = {
    "us": [
        {
            "id": "mag7",
            "name": "Magnificent 7 (US Tech)",
            "description": "Mega-cap tech innovators driving global compute and AI adoption.",
            "tickers": ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA"],
            "currency": "$",
            "market": "US"
        },
        {
            "id": "sp500_leaders",
            "name": "S&P 500 Core Leaders",
            "description": "Diversified high-conviction US market benchmark leaders.",
            "tickers": ["AAPL", "MSFT", "NVDA", "AMZN", "JPM", "V", "UNH"],
            "currency": "$",
            "market": "US"
        },
        {
            "id": "semiconductors",
            "name": "Global Semiconductor Alpha",
            "description": "Leading chip designers and foundries powering AI supercomputing.",
            "tickers": ["NVDA", "TSM", "AVGO", "AMD", "QCOM", "ARM"],
            "currency": "$",
            "market": "US"
        }
    ],
    "in": [
        {
            "id": "nifty50_core",
            "name": "Nifty 50 Bluechip Titans",
            "description": "India's highest market capitalization conglomerates and financial pillars.",
            "tickers": ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "LT.NS"],
            "currency": "₹",
            "market": "IN"
        },
        {
            "id": "nifty_it",
            "name": "Indian IT Global Exporters",
            "description": "India's premier technology consulting and digital transformation leaders.",
            "tickers": ["TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS", "LTIM.NS"],
            "currency": "₹",
            "market": "IN"
        },
        {
            "id": "nifty_banking",
            "name": "Indian Private Banking & Credit",
            "description": "Top private banking institutions driving India's credit expansion.",
            "tickers": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS"],
            "currency": "₹",
            "market": "IN"
        }
    ]
}

COMPANY_NAMES = {
    "NVDA": "NVIDIA Corporation",
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "AMZN": "Amazon.com Inc.",
    "GOOGL": "Alphabet Inc. (Google)",
    "META": "Meta Platforms Inc.",
    "TSLA": "Tesla Inc.",
    "JPM": "JPMorgan Chase & Co.",
    "V": "Visa Inc.",
    "UNH": "UnitedHealth Group Inc.",
    "TSM": "Taiwan Semiconductor Mfg.",
    "AVGO": "Broadcom Inc.",
    "AMD": "Advanced Micro Devices",
    "QCOM": "Qualcomm Inc.",
    "ARM": "Arm Holdings plc",
    "RELIANCE.NS": "Reliance Industries Ltd.",
    "TCS.NS": "Tata Consultancy Services Ltd.",
    "INFY.NS": "Infosys Limited",
    "HDFCBANK.NS": "HDFC Bank Limited",
    "ICICIBANK.NS": "ICICI Bank Limited",
    "BHARTIARTL.NS": "Bharti Airtel Limited",
    "LT.NS": "Larsen & Toubro Limited",
    "HCLTECH.NS": "HCL Technologies Ltd.",
    "WIPRO.NS": "Wipro Limited",
    "TECHM.NS": "Tech Mahindra Limited",
    "LTIM.NS": "LTIMindtree Limited",
    "KOTAKBANK.NS": "Kotak Mahindra Bank Ltd.",
    "AXISBANK.NS": "Axis Bank Limited",
    "SBIN.NS": "State Bank of India"
}

def get_quote(ticker: str) -> Dict[str, Any]:
    """Fetch live or cached quote for a ticker."""
    now = time.time()
    ticker = ticker.strip().upper()
    
    if ticker in _QUOTE_CACHE:
        cached_time, data = _QUOTE_CACHE[ticker]
        if now - cached_time < CACHE_TTL_SECONDS:
            return data
            
    try:
        tk = yf.Ticker(ticker)
        # Fetch 5-day history for fast quote & day change calculation
        hist = tk.history(period="5d")
        valid_closes = hist['Close'].dropna() if (not hist.empty and 'Close' in hist) else pd.Series(dtype=float)
        if valid_closes.empty:
            price = 100.0
            change_pct = 0.0
            prev_close = 100.0
        else:
            price = float(valid_closes.iloc[-1])
            prev_close = float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else price
            change_pct = float(((price - prev_close) / prev_close) * 100) if prev_close else 0.0

        if math.isnan(price):
            price = 100.0
        if math.isnan(prev_close):
            prev_close = price
        if math.isnan(change_pct):
            change_pct = 0.0

        is_indian = ticker.endswith(".NS") or ticker.endswith(".BO")
        currency = "₹" if is_indian else "$"
        name = COMPANY_NAMES.get(ticker) or tk.info.get('shortName') or ticker

        result = {
            "ticker": ticker,
            "name": name,
            "price": round(price, 2),
            "prev_close": round(prev_close, 2),
            "change_pct": round(change_pct, 2),
            "currency": currency,
            "market": "IN" if is_indian else "US"
        }
        _QUOTE_CACHE[ticker] = (now, result)
        return result
    except Exception as e:
        is_indian = ticker.endswith(".NS") or ticker.endswith(".BO")
        return {
            "ticker": ticker,
            "name": COMPANY_NAMES.get(ticker, ticker),
            "price": 100.0,
            "prev_close": 100.0,
            "change_pct": 0.0,
            "currency": "₹" if is_indian else "$",
            "market": "IN" if is_indian else "US",
            "error": str(e)
        }

def get_batch_quotes(tickers: List[str]) -> List[Dict[str, Any]]:
    """Fetch quotes for a list of tickers."""
    return [get_quote(t) for t in tickers]
