import json
import re
import pandas as pd
import yfinance as yf
from crewai.tools import tool
import json_repair

# Ensure scipy linkage compatibility for HRPOpt on newer scipy versions
import scipy.cluster.hierarchy as sch
if not hasattr(sch, '_LINKAGE_METHODS'):
    sch._LINKAGE_METHODS = ['single', 'complete', 'average', 'weighted', 'centroid', 'median', 'ward']

from pypfopt import expected_returns, risk_models
from pypfopt import BlackLittermanModel
from pypfopt import HRPOpt
from pypfopt.efficient_frontier import EfficientFrontier
import tools.financial_tools as ft
from simulation import unmask_ticker, unmask_views, is_masking_active

def _parse_json_or_data(data):
    if isinstance(data, (dict, list)):
        return data
    if isinstance(data, str):
        cleaned = data.strip()
        # Remove markdown code fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned)
        except Exception:
            return json_repair.loads(cleaned)
    raise ValueError(f"Unsupported data type for JSON parsing: {type(data)}")

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
        views = _parse_json_or_data(views_json)
        tickers = _parse_json_or_data(tickers_json)
        
        if not isinstance(tickers, list) or not tickers:
            return "Error: tickers must be a non-empty list of symbols."

        # Translate any masked identifiers back to real tickers for numerical calculation
        tickers = [unmask_ticker(t) or t for t in tickers]
        if isinstance(views, dict):
            views = unmask_views(views)
        
        # Ensure simulated date is respected to prevent look-ahead bias
        sim_date = getattr(ft, 'SIMULATED_DATE', None)
        if sim_date:
            end_date = pd.to_datetime(sim_date)
            start_date = end_date - pd.DateOffset(years=2)
            data = yf.download(tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))["Close"]
        else:
            data = yf.download(tickers, period="2y")["Close"]
        
        if data.empty:
            return "No historical data found for tickers."
            
        # Clean price data and ensure all tickers are present
        data = data.dropna(axis=1, how='all').ffill().bfill()
        available_tickers = list(data.columns)
        
        # Filter views to only include available tickers and ensure float values
        valid_views = {}
        if isinstance(views, dict):
            for t, v in views.items():
                if t in available_tickers:
                    try:
                        valid_views[t] = float(v)
                    except (ValueError, TypeError):
                        pass
                        
        # Compute covariance matrix and market equilibrium returns
        S = risk_models.sample_cov(data)
        pi = expected_returns.capm_return(data)
        
        try:
            if valid_views:
                bl = BlackLittermanModel(S, pi=pi, absolute_views=valid_views)
                ret_bl = bl.bl_returns()
                S_bl = bl.bl_cov()
            else:
                ret_bl = pi
                S_bl = S
            
            ef = EfficientFrontier(ret_bl, S_bl)
            ef.max_sharpe()
            cleaned_weights = ef.clean_weights()
            
            result = "Optimized Portfolio Weights (Black-Litterman):\n"
            for ticker, weight in cleaned_weights.items():
                result += f"- {ticker}: {weight*100:.2f}%\n"
                
            return result
        except Exception as bl_e:
            # Fallback to HRP if BL fails (e.g., matrix inversion issue)
            returns = data.pct_change().dropna()
            hrp = HRPOpt(returns)
            hrp.optimize()
            cleaned_weights = hrp.clean_weights()
            result = f"Black-Litterman fallback ({str(bl_e)}).\nOptimized Portfolio Weights (Hierarchical Risk Parity Fallback):\n"
            for ticker, weight in cleaned_weights.items():
                result += f"- {ticker}: {weight*100:.2f}%\n"
            return result
            
    except Exception as e:
        return f"Optimization failed: {str(e)}"
