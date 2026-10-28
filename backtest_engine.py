import os
from dotenv import load_dotenv
from crewai import Crew, Process
from agents.portfolio_agents import PortfolioAgents
from tasks.portfolio_tasks import PortfolioTasks
import yfinance as yf
import pandas as pd
import numpy as np
import json
import re

# We must import financial_tools to set the simulated date
import tools.financial_tools as ft
from simulation import activate_masking, deactivate_masking, unmask_views

load_dotenv()

def extract_weights(markdown_text, valid_tickers=None):
    """
    Parses the generated markdown to extract the portfolio weights.
    Matches lines like '- AAPL: 20.00%', '| **MSFT** | 39.27% |', or JSON formats.
    Filters out invalid symbols to prevent SMA/HIGH/TOTAL false positives.
    """
    weights = {}

    # 1. Markdown table format: | **MSFT** | 39.27% | or | MSFT | 39.27% |
    table_pattern = re.compile(r'\|\s*\*{0,2}([A-Z]{2,5})\*{0,2}\s*\|\s*(\d+(?:\.\d+)?)\s*%')
    for ticker, weight in table_pattern.findall(markdown_text):
        if valid_tickers is None or ticker in valid_tickers:
            weights[ticker] = float(weight) / 100.0

    # 2. Colon bullet format: - MSFT: 39.27% or MSFT: 39.27%
    if not weights:
        pattern = re.compile(r'[-\*\s]*\b([A-Z]{2,5})\b\s*:\s*(\d+(?:\.\d+)?)\s*%')
        matches = pattern.findall(markdown_text)
        for ticker, weight in matches:
            if valid_tickers is None or ticker in valid_tickers:
                weights[ticker] = float(weight) / 100.0
            
    # 3. Fallback: check for decimal or JSON format if percentage pattern was missed
    if not weights and valid_tickers:
        json_pattern = re.compile(r'["\']([A-Z]{2,5})["\']\s*:\s*(\d+(?:\.\d+)?)')
        for ticker, weight_val in json_pattern.findall(markdown_text):
            if ticker in valid_tickers:
                val = float(weight_val)
                weights[ticker] = val if val <= 1.0 else val / 100.0

    total_w = sum(weights.values())
    if total_w > 0:
        weights = {t: round(w / total_w, 4) for t, w in weights.items()}

    return weights

def calculate_period_return(weights, start_date, end_date):
    """
    Calculates the actual return of the portfolio from start_date to end_date.
    """
    if not weights:
        return 0.0
        
    tickers = list(weights.keys())
    data = yf.download(tickers, start=start_date, end=end_date)["Close"]
    
    if data.empty:
        return 0.0
    data = data.ffill().bfill()
        
    # Calculate percentage return for each asset over the period
    if len(tickers) == 1:
        ticker = tickers[0]
        first_val = float(data.iloc[0].item() if hasattr(data.iloc[0], 'item') else data.iloc[0])
        last_val = float(data.iloc[-1].item() if hasattr(data.iloc[-1], 'item') else data.iloc[-1])
        asset_return = (last_val - first_val) / first_val if first_val != 0 else 0.0
        return float(asset_return * weights[ticker])
        
    asset_returns = (data.iloc[-1] - data.iloc[0]) / data.iloc[0]
    
    portfolio_return = 0.0
    for ticker in tickers:
        if ticker in asset_returns:
            val = asset_returns[ticker]
            ret_val = float(val.item() if hasattr(val, 'item') else val)
            portfolio_return += ret_val * weights.get(ticker, 0)
            
    return float(portfolio_return)

def main():
    print("Initializing Multi-Agent Portfolio Simulation Engine (MASS)...\n")
    
    test_dates = [
        ("2022-11-01", "2023-01-01"),
        ("2023-01-01", "2023-03-01"),
        ("2023-03-01", "2023-05-01")
    ]
    
    cumulative_return = 1.0
    results_log = []
    
    for start_date, end_date in test_dates:
        print(f"\n{'='*50}\nSimulating Portfolio Allocation for: {start_date}\n{'='*50}")
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

        # Hack: Since screening top assets in 2022 dynamically is hard via live duckduckgo,
        # we will override the pre_selection expected output to strictly analyze our test universe.
        screener.goal = "Return ['TSLA', 'MSFT', 'AMZN', 'NFLX', 'COIN'] as JSON."
        screen_task = tasks.pre_selection_task(screener)
        screen_task.description = f"Ignore live tools. Return exactly '[\"TSLA\", \"MSFT\", \"AMZN\", \"NFLX\", \"COIN\"]' as your output for the simulated date {start_date}."
        
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
        
        print("Running Agents (Debate, Optimization, Risk Assessment)...")
        result = financial_crew.kickoff()
        
        test_universe = ['TSLA', 'MSFT', 'AMZN', 'NFLX', 'COIN']
        weights = extract_weights(str(result), valid_tickers=test_universe)
        print(f"Extracted Weights: {weights}")
        
        period_ret = calculate_period_return(weights, start_date, end_date)
        print(f"Actual Portfolio Return ({start_date} to {end_date}): {period_ret*100:.2f}%")
        
        cumulative_return *= (1 + period_ret)
        
        results_log.append({
            "Date": start_date,
            "Weights": weights,
            "Period_Return": period_ret
        })
        
        # Save progress after each period
        with open("backtest_results.json", "w") as f:
            json.dump(results_log, f, indent=4)
        
    print("\n==================================================")
    print("FINAL SIMULATION RESULTS")
    print("==================================================")
    total_ret = (cumulative_return - 1) * 100
    print(f"Total Cumulative Return (Oct 2022 - May 2023): {total_ret:.2f}%")
    
    with open("backtest_results.json", "w") as f:
        json.dump(results_log, f, indent=4)
        
if __name__ == "__main__":
    main()
