import yfinance as yf
from crewai.tools import tool
import pandas as pd
from datetime import datetime, timedelta
import json
import os

# Base directory for data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_PATH = os.path.join(BASE_DIR, 'backtest_data', 'news.json')
FUNDS_PATH = os.path.join(BASE_DIR, 'backtest_data', 'fundamentals.json')

# Global simulated date (controlled by the backtest engine)
SIMULATED_DATE = "2023-03-01"

def set_simulated_date(date_str):
    global SIMULATED_DATE
    SIMULATED_DATE = date_str

@tool("Fetch Historical Stock Data")
def fetch_stock_data(ticker: str) -> str:
    """
    Fetches the historical daily closing prices for a given stock ticker up to the current simulated date.
    Useful for technical analysis and observing price trends.
    """
    try:
        stock = yf.Ticker(ticker)
        # We need historical data ending at SIMULATED_DATE
        end_date = pd.to_datetime(SIMULATED_DATE)
        start_date = end_date - pd.DateOffset(months=6)
        
        hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
        if hist.empty:
            return f"No historical data found for {ticker} up to {SIMULATED_DATE}."
        
        hist_str = hist[['Close']].tail(10).to_string() # Just show last 10 days to save tokens
        return f"Historical Data for {ticker} (leading up to {SIMULATED_DATE}):\n{hist_str}"
    except Exception as e:
        return f"Error fetching stock data for {ticker}: {str(e)}"

@tool("Fetch Company Fundamentals")
def fetch_company_fundamentals(ticker: str) -> str:
    """
    Fetches fundamental financial data for a given stock ticker as it was on the simulated date.
    """
    try:
        with open(FUNDS_PATH, 'r') as f:
            funds_data = json.load(f)
            
        if SIMULATED_DATE in funds_data and ticker in funds_data[SIMULATED_DATE]:
            data = funds_data[SIMULATED_DATE][ticker]
            return f"Fundamentals for {ticker} on {SIMULATED_DATE}:\n- PE Ratio: {data['PE']}\n- Profit Margin: {data['Margin']}\n"
        else:
            return f"Fundamental data unavailable for {ticker} on {SIMULATED_DATE}. Assume average sector performance."
    except Exception as e:
        return f"Error fetching fundamentals for {ticker}: {str(e)}"

@tool("Calculate Technical Indicators")
def calculate_technical_indicators(ticker: str) -> str:
    """
    Calculates key technical indicators (50-day SMA, 200-day SMA, and Current Price) 
    for a given stock ticker up to the simulated date to determine trend direction.
    """
    try:
        stock = yf.Ticker(ticker)
        end_date = pd.to_datetime(SIMULATED_DATE)
        start_date = end_date - pd.DateOffset(years=1)
        
        hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
        if hist.empty:
            return f"No historical data to calculate indicators for {ticker}."
        
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        hist['SMA_200'] = hist['Close'].rolling(window=200).mean()
        
        latest = hist.iloc[-1]
        current_price = latest['Close']
        sma_50 = latest['SMA_50']
        sma_200 = latest['SMA_200']
        
        trend = "Bullish" if sma_50 > sma_200 else "Bearish"
        
        result = (
            f"Technical Indicators for {ticker} as of {SIMULATED_DATE}:\n"
            f"- Price: ${current_price:.2f}\n"
            f"- 50-Day SMA: ${sma_50:.2f}\n"
            f"- 200-Day SMA: ${sma_200:.2f}\n"
            f"- Long-Term Trend: {trend}\n"
        )
        return result
    except Exception as e:
        return f"Error calculating technical indicators for {ticker}: {str(e)}"

@tool("Fetch Stock News")
def fetch_stock_news(ticker: str) -> str:
    """
    Fetches the latest news articles and headlines for a given stock ticker up to the simulated date.
    Useful to gauge market sentiment and recent company-specific events.
    """
    try:
        with open(NEWS_PATH, 'r') as f:
            news_data = json.load(f)
            
        if SIMULATED_DATE in news_data and ticker in news_data[SIMULATED_DATE]:
            headlines = news_data[SIMULATED_DATE][ticker]
            result = f"Recent news for {ticker} (leading up to {SIMULATED_DATE}):\n"
            for h in headlines:
                result += f"- {h}\n"
            return result
        else:
            return f"No significant news found for {ticker} around {SIMULATED_DATE}."
    except Exception as e:
        return f"Error fetching news for {ticker}: {str(e)}"
