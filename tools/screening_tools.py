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
        "technology": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "INTC", "TSM", "AVGO", "CRM"],
        "finance": ["JPM", "BAC", "WFC", "C", "GS", "MS", "V", "MA", "AXP", "PYPL"],
        "healthcare": ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "DHR", "ABT", "LLY", "BMY"]
    }
    
    selected_universe = universes.get(universe_type.lower(), universes["technology"])
    
    # We return the universe to the ranking agent, which will then use FinRankGRPO to pick top_n
    result = f"Available Universe for {universe_type}:\n{', '.join(selected_universe)}\n\nPlease select the top {top_n} tickers from this list."
    return result
