"""
Autonomous Multi-Agent Portfolio Management System (MASS)
Backtest & Evaluation Engine
==========================================================
Features:
- MASS Masking Protocol for Contamination Control (Asset & Temporal Shield)
- Point-in-time simulated date pinning
- Multi-agent debate orchestration (Bull vs Bear + Debate Orchestrator)
- Black-Litterman and HRP convex quadratic optimization
- Rigorous statistical metric calculation:
  * Cumulative Returns (Discrete & Continuous Daily)
  * Daily & Annualized Volatility
  * Annualized Sharpe Ratio (with configurable risk-free rate)
  * Maximum Drawdown (MDD)
  * Calmar Ratio
  * Cross-Asset Benchmark Comparison (Equal-Weight 1/N, SPY, QQQ, FinMem)
- Supports both full live multi-agent execution and instant statistical evaluation
"""

import os
import sys
import argparse
import json
import re
from datetime import datetime
from dotenv import load_dotenv

import yfinance as yf
import pandas as pd
import numpy as np

# Internal module imports
import tools.financial_tools as ft
from simulation import (
    activate_masking,
    deactivate_masking,
    unmask_ticker,
    unmask_views,
    is_masking_active,
)

load_dotenv()

TEST_UNIVERSE = ['TSLA', 'MSFT', 'AMZN', 'NFLX', 'COIN']
BENCHMARKS = ['SPY', 'QQQ']
DEFAULT_RF_RATE = 0.04  # 4.0% annualized risk-free rate

TEST_PERIODS = [
    ("2022-11-01", "2023-01-01"),
    ("2023-01-01", "2023-03-01"),
    ("2023-03-01", "2023-05-01"),
]

# Published benchmark figures from FinMem (Yu et al., 2023, Table 2, Page 14)
# over the identical Nov 1, 2022 – May 1, 2023 testing window
FINMEM_LITERATURE_BASELINES = {
    "TSLA": {"Strategy": "FinMem (Yu et al., 2023)", "Return": 61.78, "Sharpe": 2.68, "DailyVol": 2.95, "MaxDD": -10.80},
    "NFLX": {"Strategy": "FinMem (Yu et al., 2023)", "Return": 36.45, "Sharpe": 2.02, "DailyVol": 2.30, "MaxDD": -15.85},
    "AMZN": {"Strategy": "FinMem (Yu et al., 2023)", "Return": 4.89,  "Sharpe": 0.23, "DailyVol": 2.69, "MaxDD": -22.93},
    "MSFT": {"Strategy": "FinMem (Yu et al., 2023)", "Return": 23.26, "Sharpe": 1.44, "DailyVol": 2.05, "MaxDD": -14.99},
    "COIN": {"Strategy": "FinMem (Yu et al., 2023)", "Return": 34.98, "Sharpe": 0.72, "DailyVol": 5.65, "MaxDD": -35.75},
    "FinMem_5Stock_Avg": {"Strategy": "FinMem 5-Stock Average", "Return": 32.27, "Sharpe": 1.42, "DailyVol": 3.13, "MaxDD": -20.08},
}


# ===========================================================================
# 1. Parsing & Weight Extraction
# ===========================================================================

def extract_weights(markdown_text: str, valid_tickers: list = None) -> dict:
    """
    Parses agent output to extract portfolio weights.
    Supports markdown tables, colon-separated bullets, and JSON blobs.
    Translates masked asset names (e.g. Asset_Alpha) back to real tickers.
    """
    weights = {}

    # 1. Markdown table format: | **MSFT** | 39.27% | or | Asset_Alpha | 39.27% |
    table_pattern = re.compile(r'\|\s*\*{0,2}([A-Za-z0-9_]+)\*{0,2}\s*\|\s*(\d+(?:\.\d+)?)\s*%')
    for raw_symbol, weight_str in table_pattern.findall(markdown_text):
        symbol = unmask_ticker(raw_symbol) or raw_symbol
        if valid_tickers is None or symbol in valid_tickers:
            weights[symbol] = float(weight_str) / 100.0

    # 2. Colon bullet format: - MSFT: 39.27% or - Asset_Beta: 39.27%
    if not weights:
        bullet_pattern = re.compile(r'[-\*\s]*\b([A-Za-z0-9_]+)\b\s*:\s*(\d+(?:\.\d+)?)\s*%')
        for raw_symbol, weight_str in bullet_pattern.findall(markdown_text):
            symbol = unmask_ticker(raw_symbol) or raw_symbol
            if valid_tickers is None or symbol in valid_tickers:
                weights[symbol] = float(weight_str) / 100.0

    # 3. Fallback: JSON format {"MSFT": 0.3927} or {"Asset_Alpha": 0.3927}
    if not weights:
        json_pattern = re.compile(r'["\']([A-Za-z0-9_]+)["\']\s*:\s*(\d+(?:\.\d+)?)')
        for raw_symbol, weight_val in json_pattern.findall(markdown_text):
            symbol = unmask_ticker(raw_symbol) or raw_symbol
            if valid_tickers is None or symbol in valid_tickers:
                val = float(weight_val)
                weights[symbol] = val if val <= 1.0 else val / 100.0

    total_w = sum(weights.values())
    if total_w > 0:
        weights = {t: round(w / total_w, 4) for t, w in weights.items()}

    return weights


# ===========================================================================
# 2. Period Return & Benchmark Helpers
# ===========================================================================

def calculate_period_return(weights: dict, start_date: str, end_date: str) -> float:
    """Calculates actual realized portfolio return from start_date to end_date."""
    if not weights:
        return 0.0

    tickers = list(weights.keys())
    data = yf.download(tickers, start=start_date, end=end_date, progress=False)["Close"]

    if data.empty:
        return 0.0
    data = data.ffill().bfill()

    if len(tickers) == 1:
        ticker = tickers[0]
        first_val = float(data.iloc[0].item() if hasattr(data.iloc[0], 'item') else data.iloc[0])
        last_val = float(data.iloc[-1].item() if hasattr(data.iloc[-1], 'item') else data.iloc[-1])
        asset_return = (last_val - first_val) / first_val if first_val != 0 else 0.0
        return float(asset_return * weights.get(ticker, 1.0))

    asset_returns = (data.iloc[-1] - data.iloc[0]) / data.iloc[0]

    portfolio_return = 0.0
    for ticker in tickers:
        if ticker in asset_returns:
            val = asset_returns[ticker]
            ret_val = float(val.item() if hasattr(val, 'item') else val)
            portfolio_return += ret_val * weights.get(ticker, 0.0)

    return float(portfolio_return)


def fetch_period_benchmarks(start_date: str, end_date: str, test_universe: list) -> dict:
    """Computes Equal-Weight, SPY, and QQQ returns for a given sub-period."""
    all_syms = test_universe + ['SPY', 'QQQ']
    data = yf.download(all_syms, start=start_date, end=end_date, progress=False)["Close"]
    data = data.ffill().bfill()

    bench = {}
    # 1. Equal-Weight (1/N of universe)
    ew_ret = ((data[test_universe].iloc[-1] - data[test_universe].iloc[0]) / data[test_universe].iloc[0]).mean()
    bench["Equal_Weight"] = float(ew_ret)

    # 2. SPY & QQQ
    for b in ['SPY', 'QQQ']:
        if b in data.columns:
            r = (data[b].iloc[-1] - data[b].iloc[0]) / data[b].iloc[0]
            bench[b] = float(r.item() if hasattr(r, 'item') else r)
        else:
            bench[b] = 0.0

    return bench


# ===========================================================================
# 3. Statistical Performance Engine (Sharpe, Volatility, Max Drawdown)
# ===========================================================================

def compute_timeseries_statistics(daily_returns: pd.Series, risk_free_rate: float = DEFAULT_RF_RATE) -> dict:
    """
    Computes rigorous quantitative statistics for a daily return series:
    - Cumulative Return
    - Daily Volatility
    - Annualized Volatility (sqrt(252))
    - Annualized Sharpe Ratio
    - Maximum Drawdown
    - Calmar Ratio
    """
    cleaned = daily_returns.dropna()
    if len(cleaned) == 0:
        return {
            "Cumulative_Return": 0.0,
            "Daily_Volatility": 0.0,
            "Annualized_Volatility": 0.0,
            "Sharpe_Ratio": 0.0,
            "Max_Drawdown": 0.0,
            "Calmar_Ratio": 0.0
        }

    cum_series = (1.0 + cleaned).cumprod()
    total_ret = float(cum_series.iloc[-1] - 1.0)

    daily_vol = float(cleaned.std())
    annual_vol = daily_vol * np.sqrt(252)

    rf_daily = risk_free_rate / 252.0
    excess_daily = cleaned - rf_daily
    excess_mean = float(excess_daily.mean())

    sharpe = float(np.sqrt(252) * excess_mean / daily_vol) if daily_vol > 0 else 0.0

    peak = cum_series.cummax()
    drawdown = (cum_series - peak) / peak
    max_dd = float(drawdown.min())

    # Annualized return for Calmar ratio (approximated over period fraction)
    n_days = len(cleaned)
    annualized_return = ((1.0 + total_ret) ** (252.0 / n_days) - 1.0) if n_days > 0 and total_ret > -1.0 else 0.0
    calmar = float(annualized_return / abs(max_dd)) if max_dd < 0 else 0.0

    return {
        "Cumulative_Return": total_ret,
        "Daily_Volatility": daily_vol,
        "Annualized_Volatility": annual_vol,
        "Sharpe_Ratio": sharpe,
        "Max_Drawdown": max_dd,
        "Calmar_Ratio": calmar,
        "Cumulative_Series": cum_series,
        "Daily_Returns": cleaned
    }


def evaluate_portfolio_performance(
    results_log: list,
    test_universe: list = TEST_UNIVERSE,
    risk_free_rate: float = DEFAULT_RF_RATE
) -> dict:
    """
    Builds the continuous daily time-series from the period weight vectors,
    fetches all asset and benchmark price series, and computes master comparative stats.
    """
    if not results_log:
        raise ValueError("results_log is empty; no weights to evaluate.")

    start_date = results_log[0].get("Date", TEST_PERIODS[0][0])
    end_date = "2023-05-02"  # End boundary for final period

    print(f"\n[EVAL] Fetching daily price data from {start_date} to {end_date}...")
    symbols_to_fetch = list(set(test_universe + BENCHMARKS))
    price_data = yf.download(symbols_to_fetch, start=start_date, end=end_date, progress=False)["Close"]
    price_data = price_data.ffill().bfill()
    daily_returns = price_data.pct_change().dropna()

    # Map each date in the daily return series to its active period weights
    period_weight_map = []
    for i, entry in enumerate(results_log):
        p_start = entry["Date"]
        p_end = results_log[i+1]["Date"] if i + 1 < len(results_log) else end_date
        period_weight_map.append((p_start, p_end, entry["Weights"]))

    # Construct the continuous daily portfolio returns series
    multi_agent_daily = []
    for dt in daily_returns.index:
        date_str = dt.strftime("%Y-%m-%d")
        active_weights = None
        for p_start, p_end, w in period_weight_map:
            if p_start <= date_str < p_end:
                active_weights = w
                break
        if active_weights is None:
            active_weights = period_weight_map[-1][2]

        day_ret = sum(active_weights.get(t, 0.0) * daily_returns.loc[dt, t] for t in test_universe if t in daily_returns.columns)
        multi_agent_daily.append(day_ret)

    multi_agent_series = pd.Series(multi_agent_daily, index=daily_returns.index)

    # 1. Multi-Agent Stats (Continuous Daily)
    ma_stats = compute_timeseries_statistics(multi_agent_series, risk_free_rate)

    # Discrete compounded return across the discrete periods
    discrete_cum = 1.0
    for entry in results_log:
        discrete_cum *= (1.0 + entry.get("Period_Return", 0.0))
    discrete_ret = discrete_cum - 1.0

    # 2. Benchmarks Daily Series
    ew_series = daily_returns[test_universe].mean(axis=1)
    ew_stats = compute_timeseries_statistics(ew_series, risk_free_rate)

    spy_stats = compute_timeseries_statistics(daily_returns['SPY'], risk_free_rate)
    qqq_stats = compute_timeseries_statistics(daily_returns['QQQ'], risk_free_rate)

    # 3. Individual Assets Buy & Hold
    single_asset_stats = {}
    for ticker in test_universe:
        if ticker in daily_returns.columns:
            single_asset_stats[ticker] = compute_timeseries_statistics(daily_returns[ticker], risk_free_rate)

    report_data = {
        "Multi_Agent_Daily": ma_stats,
        "Multi_Agent_Discrete_Return": discrete_ret,
        "Equal_Weight": ew_stats,
        "SPY": spy_stats,
        "QQQ": qqq_stats,
        "Single_Assets": single_asset_stats,
        "Results_Log": results_log
    }

    # Format and print the Master Academic Comparison Table
    print_academic_comparison_table(report_data)

    return report_data


def print_academic_comparison_table(report: dict) -> None:
    """Prints the comprehensive master table matching Table 2 in technical_report.md."""
    ma = report["Multi_Agent_Daily"]
    disc_ret = report["Multi_Agent_Discrete_Return"]
    ew = report["Equal_Weight"]
    spy = report["SPY"]
    qqq = report["QQQ"]
    singles = report["Single_Assets"]

    table_md = """
| Ticker / Portfolio | Strategy / Model | Cumulative Return (%) | Sharpe Ratio | Daily Volatility (%) | Max Drawdown (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
"""
    # Individual assets (Buy & Hold vs FinMem)
    for ticker in TEST_UNIVERSE:
        st = singles.get(ticker)
        if st:
            table_md += f"| **{ticker}** | Buy & Hold | {st['Cumulative_Return']*100:+.2f}% | {st['Sharpe_Ratio']:.2f} | {st['Daily_Volatility']*100:.2f}% | {st['Max_Drawdown']*100:.2f}% |\n"
        if ticker in FINMEM_LITERATURE_BASELINES:
            fm = FINMEM_LITERATURE_BASELINES[ticker]
            table_md += f"| | **FinMem** (Yu et al., 2023) | **+{fm['Return']:.2f}%** | **{fm['Sharpe']:.2f}** | {fm['DailyVol']:.2f}% | **{fm['MaxDD']:.2f}%** |\n"

    # Cross-Asset Benchmarks
    table_md += f"| **CROSS-ASSET** | **Equal-Weight Universe (1/N)** | **{ew['Cumulative_Return']*100:+.2f}%** | **{ew['Sharpe_Ratio']:.2f}** | **{ew['Daily_Volatility']*100:.2f}%** | **{ew['Max_Drawdown']*100:.2f}%** |\n"
    table_md += f"| **BENCHMARKS** | **S&P 500 (SPY)** | **{spy['Cumulative_Return']*100:+.2f}%** | **{spy['Sharpe_Ratio']:.2f}** | **{spy['Daily_Volatility']*100:.2f}%** | **{spy['Max_Drawdown']*100:.2f}%** |\n"
    table_md += f"| | **Nasdaq 100 (QQQ)** | **{qqq['Cumulative_Return']*100:+.2f}%** | **{qqq['Sharpe_Ratio']:.2f}** | **{qqq['Daily_Volatility']*100:.2f}%** | **{qqq['Max_Drawdown']*100:.2f}%** |\n"
    
    fm_avg = FINMEM_LITERATURE_BASELINES["FinMem_5Stock_Avg"]
    table_md += f"| | **FinMem 5-Stock Average** | **+{fm_avg['Return']:.2f}%** | **{fm_avg['Sharpe']:.2f}** | **{fm_avg['DailyVol']:.2f}%** | **{fm_avg['MaxDD']:.2f}%** |\n"
    table_md += f"| | **Multi-Agent (Ours - Daily Series)** | **{ma['Cumulative_Return']*100:+.2f}%** | **{ma['Sharpe_Ratio']:.2f}** | **{ma['Daily_Volatility']*100:.2f}%** | **{ma['Max_Drawdown']*100:.2f}%** |\n"
    table_md += f"| | **Multi-Agent (Ours - Discrete Comp)** | **{disc_ret*100:+.2f}%** | **{ma['Sharpe_Ratio']:.2f}** | **{ma['Daily_Volatility']*100:.2f}%** | **{ma['Max_Drawdown']*100:.2f}%** |\n"

    print("\n" + "=" * 80)
    print("MASTER EMPIRICAL BENCHMARK COMPARISON TABLE")
    print("=" * 80)
    print(table_md)
    print("=" * 80)

    # Save to markdown report file
    with open("backtest_summary.md", "w") as f:
        f.write("# Multi-Agent Portfolio Management System — Empirical Evaluation\n\n")
        f.write(f"Generated at: {datetime.now().isoformat()}\n\n")
        f.write(table_md)


# ===========================================================================
# 4. Simulation Execution Pipeline
# ===========================================================================

def run_simulation(live_llm: bool = False, mask_identifiers: bool = True) -> list:
    """
    Runs the multi-period backtesting simulation.
    If live_llm is True, kicks off CrewAI agents.
    If live_llm is False, loads saved empirical weights and runs full statistical evaluation.
    """
    if mask_identifiers:
        activate_masking(TEST_UNIVERSE)
    else:
        deactivate_masking()

    if not live_llm:
        print("\n[MASS] Running in Statistical Evaluation Mode (loading empirical results)...")
        results_path = "backtest_results.json"
        if not os.path.exists(results_path):
            raise FileNotFoundError(f"Cannot find {results_path} to evaluate.")
        with open(results_path, "r") as f:
            results_log = json.load(f)
        return results_log

    # Lazy-import CrewAI to keep evaluation lightweight when offline
    from crewai import Crew, Process
    from agents.portfolio_agents import PortfolioAgents
    from tasks.portfolio_tasks import PortfolioTasks

    results_log = []
    cumulative_return = 1.0

    for start_date, end_date in TEST_PERIODS:
        print(f"\n{'='*60}\nSimulating Allocation for Period: {start_date} -> {end_date}\n{'='*60}")
        ft.set_simulated_date(start_date)

        agents = PortfolioAgents()
        tasks = PortfolioTasks()

        screener = agents.pre_selection_agent()
        quant_agent = agents.quantitative_analyst()
        bull_agent = agents.bull_researcher()
        bear_agent = agents.bear_researcher()
        debate_agent = agents.debate_orchestrator()
        risk_agent = agents.risk_manager()
        portfolio_agent = agents.portfolio_manager()

        # Task definitions
        screen_task = tasks.pre_selection_task(screener)
        if mask_identifiers:
            masked_symbols = [unmask_ticker(t) or t for t in TEST_UNIVERSE]
            from simulation import _TICKER_TO_MASK
            masked_symbols = [_TICKER_TO_MASK.get(t, t) for t in TEST_UNIVERSE]
            screener.goal = f"Return {json.dumps(masked_symbols)} as JSON."
            screen_task.description = (
                f"Ignore live tools. Return strictly {json.dumps(masked_symbols)} as your JSON list of "
                f"masked candidate assets for deep quantitative and qualitative analysis for simulated date {start_date}."
            )
        else:
            screener.goal = f"Return {json.dumps(TEST_UNIVERSE)} as JSON."
            screen_task.description = f"Ignore live tools. Return strictly {json.dumps(TEST_UNIVERSE)} as your output for simulated date {start_date}."
        quant_task = tasks.quantitative_analysis_task(quant_agent)
        bull_task = tasks.bull_analysis_task(bull_agent)
        bear_task = tasks.bear_analysis_task(bear_agent)
        debate_task = tasks.debate_task(debate_agent)
        risk_task = tasks.risk_assessment_task(risk_agent)
        strategy_task = tasks.strategy_recommendation_task(portfolio_agent)

        financial_crew = Crew(
            agents=[screener, quant_agent, bull_agent, bear_agent, debate_agent, risk_agent, portfolio_agent],
            tasks=[screen_task, quant_task, bull_task, bear_task, debate_task, risk_task, strategy_task],
            process=Process.sequential,
            verbose=True
        )

        print("[MASS] Running Multi-Agent Debate & Convex Optimization Pipeline...")
        result = financial_crew.kickoff()

        weights = extract_weights(str(result), valid_tickers=TEST_UNIVERSE)
        print(f"[MASS] Extracted Weights for {start_date}: {weights}")

        period_ret = calculate_period_return(weights, start_date, end_date)
        bench_ret = fetch_period_benchmarks(start_date, end_date, TEST_UNIVERSE)

        cumulative_return *= (1.0 + period_ret)
        alpha_ew = period_ret - bench_ret.get("Equal_Weight", 0.0)

        entry = {
            "Date": start_date,
            "Period": f"{start_date} to {end_date}",
            "Weights": weights,
            "Period_Return": round(period_ret, 4),
            "Benchmark_Equal_Weight": round(bench_ret.get("Equal_Weight", 0.0), 4),
            "Benchmark_SPY": round(bench_ret.get("SPY", 0.0), 4),
            "Benchmark_QQQ": round(bench_ret.get("QQQ", 0.0), 4),
            "Alpha_vs_EW": round(alpha_ew, 4),
        }
        results_log.append(entry)

        out_file = "backtest_results_masked_exp2.json" if mask_identifiers else "backtest_results_unmasked_exp1.json"
        with open(out_file, "w") as f:
            json.dump(results_log, f, indent=4)
        with open("backtest_results.json", "w") as f:
            json.dump(results_log, f, indent=4)

    return results_log


# ===========================================================================
# 5. CLI Entry Point
# ===========================================================================

def main():
    parser = argparse.ArgumentParser(description="Autonomous Multi-Agent Portfolio Backtest & Evaluation Engine")
    parser.add_argument("--eval-only", action="store_true", help="Run quantitative evaluation on saved empirical results without calling LLMs")
    parser.add_argument("--live", action="store_true", help="Execute live LLM multi-agent crew backtest")
    parser.add_argument("--no-mask", action="store_true", help="Disable MASS contamination masking protocol")
    parser.add_argument("--rf", type=float, default=DEFAULT_RF_RATE, help="Annualized risk-free rate (default 0.04)")
    args = parser.parse_args()

    # Determine execution mode: if not explicitly --live, default to evaluation mode
    run_live = args.live
    use_masking = not args.no_mask

    print("\n" + "=" * 60)
    print("Multi-Agent Simulation Scaling (MASS) Portfolio Engine")
    print(f"Mode: {'LIVE AGENT SIMULATION' if run_live else 'STATISTICAL EVALUATION & VERIFICATION'}")
    print(f"Contamination Masking: {'ACTIVE' if use_masking else 'DISABLED'}")
    print(f"Risk-Free Rate: {args.rf * 100:.1f}%")
    print("=" * 60)

    try:
        results_log = run_simulation(live_llm=run_live, mask_identifiers=use_masking)
        evaluate_portfolio_performance(results_log, TEST_UNIVERSE, risk_free_rate=args.rf)
    except Exception as e:
        print(f"\n[ERROR] Simulation/Evaluation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
