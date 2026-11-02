from crewai.tools import tool
import yfinance as yf

@tool("Screen Top Assets")
def screen_top_assets(universe_type: str = "technology", top_n: int = 4) -> str:
    """
    Ranks and selects the top N assets from a broader universe.
    Inputs:
    - universe_type: The sector or list to screen (e.g., 'technology', 'finance').
    - top_n: Number of assets to return.
    Returns: A JSON string list of the top N tickers to analyze.
    """
    # In a full production system, this would query a screener API (like Finviz or yfinance screener)
    # and perform listwise ranking via an LLM. Here, we simulate the universe and let the LLM filter.
    
    universes = {
        "technology": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "TSLA", "AVGO", "CRM"],
        "us_tech": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA"],
        "sp500": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "BRK-B", "JPM", "V", "UNH"],
        "finance": ["JPM", "BAC", "WFC", "C", "GS", "MS", "V", "MA", "AXP", "PYPL"],
        "healthcare": ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "DHR", "ABT", "LLY", "BMY"],
        "nifty50": ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LT.NS", "HINDUNILVR.NS"],
        "indian_market": ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "ITC.NS", "SBIN.NS"],
        "indian_it": ["TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS", "LTIM.NS"],
        "indian_banking": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"]
    }
    
    selected_universe = universes.get(universe_type.lower(), universes["technology"])
    
    # We return the universe to the ranking agent, which will then use FinRankGRPO to pick top_n
    result = f"Available Universe for {universe_type}:\n{', '.join(selected_universe)}\n\nPlease select the top {top_n} tickers from this list."
    return result
