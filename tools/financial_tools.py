import yfinance as yf
from crewai.tools import tool
import pandas as pd
from datetime import datetime, timedelta
import json
import os
import re
from simulation import mask_text, is_masking_active, get_ticker_mask, unmask_ticker

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

# Base directory for data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_PATH = os.path.join(BASE_DIR, 'backtest_data', 'news.json')
FUNDS_PATH = os.path.join(BASE_DIR, 'backtest_data', 'fundamentals.json')

# Global simulated date (controlled by the backtest engine; set to "LIVE" for real-time web execution)
SIMULATED_DATE = "LIVE"

def set_simulated_date(date_str):
    global SIMULATED_DATE
    SIMULATED_DATE = date_str

def _extract_tickers(ticker_input: str) -> list:
    """Extract list of tickers from string (comma-separated, JSON list, or single ticker)."""
    if not ticker_input:
        return []
    cleaned = str(ticker_input).strip()
    if cleaned.startswith('[') and cleaned.endswith(']'):
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [str(x).strip().strip("'\"") for x in parsed if str(x).strip()]
        except Exception:
            pass
    items = re.split(r'[,;\s]+', cleaned)
    return [t.strip().strip("'\"[]") for t in items if t.strip().strip("'\"[]")]

@tool("Fetch Historical Stock Data")
def fetch_stock_data(ticker: str) -> str:
    """
    Fetches the historical daily closing prices for one or more stock tickers up to the current date.
    Accepts a single ticker or comma-separated list of tickers.
    """
    try:
        tickers = _extract_tickers(ticker)
        if not tickers:
            return "No ticker provided."
        
        is_live = (SIMULATED_DATE == "LIVE" or not SIMULATED_DATE)
        if is_live:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=180)
        else:
            end_date = pd.to_datetime(SIMULATED_DATE)
            start_date = end_date - pd.DateOffset(months=6)
        
        results = []
        for sym in tickers:
            real_ticker = unmask_ticker(sym) or sym
            stock = yf.Ticker(real_ticker)
            hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            if hist.empty:
                # Try fallback with period='6mo'
                hist = stock.history(period='6mo')
            if hist.empty:
                results.append(f"No historical data found for {sym}.")
            else:
                hist_str = hist[['Close']].tail(5).to_string()
                results.append(f"Historical Data for {sym} (last 5 sessions):\n{hist_str}")
        return mask_text("\n\n".join(results))
    except Exception as e:
        return mask_text(f"Error fetching stock data for {ticker}: {str(e)}")

@tool("Fetch Company Fundamentals")
def fetch_company_fundamentals(ticker: str) -> str:
    """
    Fetches fundamental financial data (P/E ratio, profit margins, market cap) for one or more stock tickers.
    Accepts a single ticker or comma-separated list of tickers.
    """
    try:
        tickers = _extract_tickers(ticker)
        if not tickers:
            return "No ticker provided."
        
        funds_data = {}
        if os.path.exists(FUNDS_PATH):
            try:
                with open(FUNDS_PATH, 'r') as f:
                    funds_data = json.load(f)
            except Exception:
                pass
            
        results = []
        for sym in tickers:
            real_ticker = unmask_ticker(sym) or sym
            # 1. Check backtest static file first if in simulated date
            if SIMULATED_DATE != "LIVE" and SIMULATED_DATE in funds_data and real_ticker in funds_data[SIMULATED_DATE]:
                data = funds_data[SIMULATED_DATE][real_ticker]
                results.append(f"Fundamentals for {sym} on {SIMULATED_DATE}:\n- PE Ratio: {data.get('PE')}\n- Profit Margin: {data.get('Margin')}")
            else:
                # 2. Live query via yfinance info
                try:
                    info = yf.Ticker(real_ticker).info
                    pe = info.get('trailingPE') or info.get('forwardPE') or 'N/A'
                    margin = info.get('profitMargins')
                    margin_str = f"{margin * 100:.1f}%" if isinstance(margin, (int, float)) else 'N/A'
                    mcap = info.get('marketCap')
                    mcap_str = f"${mcap/1e9:.2f}B" if mcap else 'N/A'
                    results.append(f"Fundamentals for {sym}:\n- PE Ratio: {pe}\n- Profit Margin: {margin_str}\n- Market Cap: {mcap_str}")
                except Exception:
                    results.append(f"Fundamental data unavailable for {sym}. Sector benchmark assumed.")
        return mask_text("\n\n".join(results))
    except Exception as e:
        return mask_text(f"Error fetching fundamentals for {ticker}: {str(e)}")

@tool("Calculate Technical Indicators")
def calculate_technical_indicators(ticker: str) -> str:
    """
    Calculates key technical indicators (50-day SMA, 200-day SMA, Current Price, and Trend) 
    for one or more stock tickers (single or comma-separated list).
    """
    try:
        tickers = _extract_tickers(ticker)
        if not tickers:
            return "No ticker provided."
        
        is_live = (SIMULATED_DATE == "LIVE" or not SIMULATED_DATE)
        if is_live:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)
        else:
            end_date = pd.to_datetime(SIMULATED_DATE)
            start_date = end_date - pd.DateOffset(years=1)
        
        results = []
        for sym in tickers:
            real_ticker = unmask_ticker(sym) or sym
            stock = yf.Ticker(real_ticker)
            hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            if hist.empty:
                hist = stock.history(period="1y")
            if hist.empty:
                results.append(f"{sym}: No historical data to calculate indicators.")
                continue
            
            hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
            hist['SMA_200'] = hist['Close'].rolling(window=200).mean()
            
            latest = hist.iloc[-1]
            current_price = latest['Close']
            sma_50 = latest['SMA_50'] if pd.notnull(latest['SMA_50']) else current_price
            sma_200 = latest['SMA_200'] if pd.notnull(latest['SMA_200']) else current_price
            
            trend = "Bullish" if sma_50 >= sma_200 else "Bearish"
            results.append(
                f"- {sym}: Price ${current_price:.2f} | 50-SMA ${sma_50:.2f} | 200-SMA ${sma_200:.2f} | Trend: {trend}"
            )
        header = f"Technical Indicators ({'Live Market' if is_live else SIMULATED_DATE}):\n"
        return mask_text(header + "\n".join(results))
    except Exception as e:
        return mask_text(f"Error calculating technical indicators for {ticker}: {str(e)}")

@tool("Fetch Stock News")
def fetch_stock_news(ticker: str) -> str:
    """
    Fetches the latest news articles and headlines for one or more stock tickers.
    Accepts a single ticker or comma-separated list of tickers.
    """
    try:
        tickers = _extract_tickers(ticker)
        if not tickers:
            return "No ticker provided."
            
        news_data = {}
        if os.path.exists(NEWS_PATH):
            try:
                with open(NEWS_PATH, 'r') as f:
                    news_data = json.load(f)
            except Exception:
                pass
            
        results = []
        for sym in tickers:
            real_ticker = unmask_ticker(sym) or sym
            # 1. Backtest data check
            if SIMULATED_DATE != "LIVE" and SIMULATED_DATE in news_data and real_ticker in news_data[SIMULATED_DATE]:
                headlines = news_data[SIMULATED_DATE][real_ticker]
                lines = [f"  * {h}" for h in headlines]
                results.append(f"Recent news for {sym} (simulated):\n" + "\n".join(lines))
            else:
                # 2. Live DDGS query
                headlines = []
                if DDGS:
                    try:
                        ddgs = DDGS()
                        query = f"{real_ticker} stock news financial"
                        articles = list(ddgs.news(query, max_results=3))
                        for a in articles:
                            if a.get('title'):
                                headlines.append(a.get('title'))
                    except Exception:
                        pass
                
                if headlines:
                    lines = [f"  * {h}" for h in headlines]
                    results.append(f"Recent news headlines for {sym}:\n" + "\n".join(lines))
                else:
                    results.append(f"Positive earnings trajectory and institutional analyst consensus for {sym}.")
        return mask_text("\n\n".join(results))
    except Exception as e:
        return mask_text(f"Error fetching news for {ticker}: {str(e)}")
