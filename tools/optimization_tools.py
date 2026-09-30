import json
import pandas as pd
import yfinance as yf
from crewai.tools import tool
from pypfopt import expected_returns, risk_models
from pypfopt import BlackLittermanModel
from pypfopt import HRPOpt
from pypfopt.efficient_frontier import EfficientFrontier

@tool("Optimize Portfolio mathematically")
def calculate_optimal_portfolio(views_json: str, tickers_json: str) -> str:
    """
    Optimizes portfolio weights mathematically based on the agent's absolute views.
    Inputs:
    - views_json: A JSON string of absolute views, e.g. {"AAPL": 0.05, "MSFT": -0.02}. Positive for bullish, negative for bearish expected returns.
    - tickers_json: A JSON string list of tickers, e.g. '["AAPL", "MSFT", "NVDA", "GOOGL"]'
    Returns: A string with the optimal weights.
    """
    try:
        views = json.loads(views_json)
        tickers = json.loads(tickers_json)
        
        # Fetch historical prices
        data = yf.download(tickers, period="5y")["Close"]
        
        if data.empty:
            return "No historical data found for tickers."
            
        # Compute covariance matrix and market equilibrium returns
        S = risk_models.sample_cov(data)
        pi = expected_returns.capm_return(data)
        
        try:
            bl = BlackLittermanModel(S, pi=pi, absolute_views=views)
            ret_bl = bl.bl_returns()
            S_bl = bl.bl_cov()
            
            ef = EfficientFrontier(ret_bl, S_bl)
            weights = ef.max_sharpe()
            cleaned_weights = ef.clean_weights()
            
            result = "Optimized Portfolio Weights (Black-Litterman):\n"
            for ticker, weight in cleaned_weights.items():
                result += f"- {ticker}: {weight*100:.2f}%\n"
                
            return result
        except Exception as bl_e:
            # Fallback to HRP if BL fails (e.g., matrix inversion issue)
            hrp = HRPOpt(data.pct_change().dropna())
            hrp.optimize()
            cleaned_weights = hrp.clean_weights()
            result = f"Black-Litterman failed ({str(bl_e)}).\nOptimized Portfolio Weights (Hierarchical Risk Parity Fallback):\n"
            for ticker, weight in cleaned_weights.items():
                result += f"- {ticker}: {weight*100:.2f}%\n"
            return result
            
    except Exception as e:
        return f"Optimization failed: {str(e)}"
