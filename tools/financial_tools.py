import yfinance as yf
from crewai.tools import tool
import pandas as pd
from datetime import datetime, timedelta

@tool("Fetch Historical Stock Data")
def fetch_stock_data(ticker: str) -> str:
    """
    Fetches the last 6 months of historical daily closing prices for a given stock ticker.
    Useful for technical analysis and observing price trends.
    """
    try:
        stock = yf.Ticker(ticker)
        # Get historical market data for the last 6 months
        hist = stock.history(period="6mo")
        if hist.empty:
            return f"No historical data found for {ticker}."
        
        # Keep only Date and Close columns for simplicity
        hist_str = hist[['Close']].to_string()
        return f"Historical 6-month Data for {ticker}:\n{hist_str}"
    except Exception as e:
        return f"Error fetching stock data for {ticker}: {str(e)}"

@tool("Fetch Company Fundamentals")
def fetch_company_fundamentals(ticker: str) -> str:
    """
    Fetches fundamental financial data for a given stock ticker, 
    including market cap, PE ratio, forward PE, dividend yield, and analyst recommendations.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        fundamentals = {
            "Sector": info.get("sector", "N/A"),
            "Industry": info.get("industry", "N/A"),
            "Market Cap": info.get("marketCap", "N/A"),
            "Trailing PE": info.get("trailingPE", "N/A"),
            "Forward PE": info.get("forwardPE", "N/A"),
            "Dividend Yield": info.get("dividendYield", "N/A"),
            "Profit Margin": info.get("profitMargins", "N/A"),
            "Operating Margin": info.get("operatingMargins", "N/A"),
            "Recommendation": info.get("recommendationKey", "N/A")
        }
        
        result = f"Fundamentals for {ticker}:\n"
        for key, value in fundamentals.items():
            result += f"- {key}: {value}\n"
        return result
    except Exception as e:
        return f"Error fetching fundamentals for {ticker}: {str(e)}"

@tool("Calculate Technical Indicators")
def calculate_technical_indicators(ticker: str) -> str:
    """
    Calculates key technical indicators (50-day SMA, 200-day SMA, and Current Price) 
    for a given stock ticker to determine trend direction.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y")
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
            f"Technical Indicators for {ticker}:\n"
            f"- Current Price: ${current_price:.2f}\n"
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
    Fetches the latest news articles and headlines for a given stock ticker.
    Useful to gauge market sentiment and recent company-specific events.
    """
    try:
        stock = yf.Ticker(ticker)
        news = stock.news
        if not news:
            return f"No recent news found for {ticker}."
        
        result = f"Recent news for {ticker}:\n"
        for item in news[:5]: # Get top 5 news items
            content = item.get("content", {})
            title = content.get("title", "No Title")
            provider = content.get("provider", {})
            publisher = provider.get("displayName", "Unknown Publisher")
            result += f"- {title} (Source: {publisher})\n"
        return result
    except Exception as e:
        return f"Error fetching news for {ticker}: {str(e)}"
