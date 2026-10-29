import json
import re
from typing import Optional, Type, Any
import pandas as pd
import yfinance as yf
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
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
from simulation import unmask_ticker, unmask_views, is_masking_active, get_ticker_mask, _TICKER_TO_MASK

def _parse_json_or_data(data):
    if data is None:
        return None
    if isinstance(data, (dict, list)):
        return data
    if isinstance(data, str):
        cleaned = data.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned)
        except Exception:
            try:
                return json_repair.loads(cleaned)
            except Exception:
                items = [t.strip().strip("'\"[]") for t in cleaned.split(',') if t.strip()]
                return items
    return data

class OptimizationInput(BaseModel):
    views_json: Optional[Any] = Field(None, description="JSON string or dict of views, e.g. {'Asset_Alpha': 0.05, 'Asset_Beta': -0.02}")
    tickers_json: Optional[Any] = Field(None, description="JSON string or list of tickers, e.g. ['Asset_Alpha', 'Asset_Beta']")
    views: Optional[Any] = Field(None, description="Alternative field for views JSON")
    tickers: Optional[Any] = Field(None, description="Alternative field for tickers list")

class CalculateOptimalPortfolioTool(BaseTool):
    name: str = "Optimize Portfolio mathematically"
    description: str = (
        "Optimizes portfolio weights mathematically based on the agent's absolute views using Black-Litterman and HRP. "
        "Accepts views_json and tickers_json. Never hallucinate weights; returns the exact continuous optimal weights."
    )
    args_schema: Type[BaseModel] = OptimizationInput

    def _run(
        self,
        views_json: Optional[Any] = None,
        tickers_json: Optional[Any] = None,
        views: Optional[Any] = None,
        tickers: Optional[Any] = None,
        **kwargs: Any
    ) -> str:
        try:
            raw_views = views_json if views_json is not None else (views if views is not None else kwargs.get("views"))
            raw_tickers = tickers_json if tickers_json is not None else (tickers if tickers is not None else kwargs.get("tickers"))

            parsed_views = _parse_json_or_data(raw_views) if raw_views else {}
            parsed_tickers = _parse_json_or_data(raw_tickers) if raw_tickers else []

            # If tickers is empty but views has keys, derive tickers from views keys
            if (not parsed_tickers or not isinstance(parsed_tickers, list)) and isinstance(parsed_views, dict) and parsed_views:
                parsed_tickers = list(parsed_views.keys())

            if not isinstance(parsed_tickers, list) or not parsed_tickers:
                default_symbols = ["TSLA", "MSFT", "AMZN", "NFLX", "COIN"]
                if is_masking_active():
                    parsed_tickers = [_TICKER_TO_MASK.get(t, t) for t in default_symbols]
                else:
                    parsed_tickers = list(default_symbols)

            if not isinstance(parsed_views, dict) or not parsed_views:
                parsed_views = {t: 0.0 for t in parsed_tickers}

            # Translate any masked identifiers back to real tickers for numerical calculation
            canonical_tickers = [unmask_ticker(t) or t for t in parsed_tickers]
            canonical_views = unmask_views(parsed_views) if isinstance(parsed_views, dict) else {}

            # Ensure simulated date is respected to prevent look-ahead bias
            sim_date = getattr(ft, 'SIMULATED_DATE', None)
            if sim_date:
                end_date = pd.to_datetime(sim_date)
                start_date = end_date - pd.DateOffset(years=2)
                data = yf.download(canonical_tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)["Close"]
            else:
                data = yf.download(canonical_tickers, period="2y", progress=False)["Close"]

            if data.empty:
                return "No historical data found for tickers."

            # Clean price data and ensure all tickers are present
            data = data.dropna(axis=1, how='all').ffill().bfill()
            available_tickers = list(data.columns)

            # Filter views to only include available tickers and ensure float values
            valid_views = {}
            if isinstance(canonical_views, dict):
                for t, v in canonical_views.items():
                    if t in available_tickers:
                        try:
                            valid_views[t] = float(v)
                        except (ValueError, TypeError):
                            pass

            # Compute covariance matrix and market equilibrium returns
            S = risk_models.sample_cov(data)
            pi = expected_returns.capm_return(data)

            method_used = "Black-Litterman"
            cleaned_weights = {}

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
            except Exception as bl_e:
                method_used = f"Hierarchical Risk Parity Fallback ({str(bl_e)})"
                returns = data.pct_change().dropna()
                hrp = HRPOpt(returns)
                hrp.optimize()
                cleaned_weights = hrp.clean_weights()

            # Format the output weights (masking tickers if active)
            table_lines = [
                f"### Optimized Portfolio Weights ({method_used})\n",
                "| Asset | Optimal Allocation |",
                "| :--- | :---: |"
            ]
            bullet_lines = []

            for sym, weight in cleaned_weights.items():
                display_sym = get_ticker_mask(sym) if is_masking_active() else sym
                pct = weight * 100.0
                table_lines.append(f"| **{display_sym}** | {pct:.2f}% |")
                bullet_lines.append(f"- {display_sym}: {pct:.2f}%")

            output_report = "\n".join(table_lines) + "\n\n" + "\n".join(bullet_lines)
            return output_report

        except Exception as e:
            return f"Optimization failed: {str(e)}"

calculate_optimal_portfolio = CalculateOptimalPortfolioTool()
