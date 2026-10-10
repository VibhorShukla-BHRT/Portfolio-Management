import os
from dotenv import load_dotenv
from crewai import Crew, Process
from agents.portfolio_agents import PortfolioAgents
from tasks.portfolio_tasks import PortfolioTasks
import yfinance as yf
import pandas as pd
import json
import re

# We must import financial_tools to set the simulated date
import tools.financial_tools as ft

load_dotenv()

def extract_weights(markdown_text):
    """
    Parses the generated markdown to extract the portfolio weights.
    Looks for lines like '- AAPL: 20.00%' or 'AAPL: 0.20'
    """
    weights = {}
    # Simple regex to find ticker and percentage
    pattern = re.compile(r'([A-Z]{3,5}).*?(\d+\.\d+)\s*%')
    matches = pattern.findall(markdown_text)
    for ticker, weight in matches:
        weights[ticker] = float(weight) / 100.0
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
        
    # Calculate percentage return for each asset over the period
    if len(tickers) == 1:
        asset_returns = (data.iloc[-1] - data.iloc[0]) / data.iloc[0]
        return asset_returns * weights[tickers[0]]
        
    asset_returns = (data.iloc[-1] - data.iloc[0]) / data.iloc[0]
    
    portfolio_return = 0.0
    for ticker in tickers:
        if ticker in asset_returns:
            portfolio_return += asset_returns[ticker] * weights.get(ticker, 0)
            
    return portfolio_return

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
            verbose=False
        )
        
        print("Running Agents (Debate, Optimization, Risk Assessment)...")
        result = financial_crew.kickoff()
        
        weights = extract_weights(str(result))
        print(f"Extracted Weights: {weights}")
        
        period_ret = calculate_period_return(weights, start_date, end_date)
        print(f"Actual Portfolio Return ({start_date} to {end_date}): {period_ret*100:.2f}%")
        
        cumulative_return *= (1 + period_ret)
        
        results_log.append({
            "Date": start_date,
            "Weights": weights,
            "Period_Return": period_ret
        })
        
    print("\n==================================================")
    print("FINAL SIMULATION RESULTS")
    print("==================================================")
    total_ret = (cumulative_return - 1) * 100
    print(f"Total Cumulative Return (Oct 2022 - May 2023): {total_ret:.2f}%")
    
    with open("backtest_results.json", "w") as f:
        json.dump(results_log, f, indent=4)
        
if __name__ == "__main__":
    main()
