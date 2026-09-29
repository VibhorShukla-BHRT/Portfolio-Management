# Multi-Agent Portfolio Management System - Project Report

## 1. Project Overview
The **Multi-Agent Portfolio Management System** is an automated financial analysis tool built using **CrewAI**. It leverages the reasoning capabilities of Large Language Models (LLMs)—specifically OpenRouter models—to simulate a team of financial experts. The system analyzes a predefined set of technology stocks (currently AAPL, MSFT, NVDA, GOOGL) and outputs a comprehensive portfolio strategy.

## 2. Architecture & Components
The system is logically divided into Agents, Tasks, and Tools, mirroring a real-world financial firm. The workflow follows a sequential process where analysts conduct independent research and feed their findings to a chief manager for final decision-making.

### 2.1. Agents (`agents/portfolio_agents.py`)
There are four specialized AI agents defined in the system:
*   **Quantitative Financial Analyst:** Focuses on historical price data and technical indicators to identify market trends. Equipped with tools to analyze moving averages and short-to-medium-term price movements.
*   **Fundamental Equity Analyst:** Evaluates company financials (balance sheets, P/E ratios, profit margins) and news sentiment to determine intrinsic value and health.
*   **Risk Management Specialist:** Assesses downside risk, overall volatility, macroeconomic conditions, and sector-specific headwinds to ensure capital preservation.
*   **Chief Portfolio Manager:** The final decision-maker who synthesizes insights from the other three agents to allocate assets optimally, balancing profit maximization with prudent risk management.

### 2.2. Tasks (`tasks/portfolio_tasks.py`)
Each agent is assigned a specific task to complete the pipeline:
*   **Technical Analysis Task:** Fetch historical data, calculate SMAs, and rate stocks with a 'Bullish', 'Bearish', or 'Neutral' technical rating.
*   **Fundamental Analysis Task:** Fetch company fundamentals, analyze recent news, and rate stocks with a 'Strong', 'Moderate', or 'Weak' fundamental rating.
*   **Risk Assessment Task:** Evaluate market and company risks, assigning a 'High', 'Medium', or 'Low' risk score to each asset.
*   **Strategy Recommendation Task:** Review all previous reports and formulate a final markdown strategy document with BUY/HOLD/SELL recommendations and a percentage-based portfolio allocation for a hypothetical $100,000 portfolio.

### 2.3. Tools (`tools/financial_tools.py`)
These Python functions empower the agents to access real-world financial data dynamically, using `yfinance` under the hood:
*   `fetch_stock_data(ticker)`: Retrieves the last 6 months of historical daily closing prices.
*   `fetch_company_fundamentals(ticker)`: Retrieves critical metrics like market cap, P/E ratios, margins, and dividend yields.
*   `calculate_technical_indicators(ticker)`: Calculates 50-day and 200-day Simple Moving Averages (SMA) to identify long-term trends.
*   `fetch_stock_news(ticker)`: Gathers the top 5 recent news headlines for sentiment analysis and event tracking.

## 3. Tech Stack
*   **Agent Orchestration:** [CrewAI](https://github.com/joaomdmoura/crewAI)
*   **LLM Engine:** OpenRouter (using the `openrouter/free` model routing), interfaced via `litellm`.
*   **Financial Market Data:** `yfinance` (Yahoo Finance API)
*   **Data Processing:** `pandas`
*   **Environment Management:** `python-dotenv`
*   **Search/Web:** `duckduckgo-search`

## 4. Current Progress & Status
The foundational architecture of the project is successfully implemented and operational:
*   **Agent framework is complete:** The system successfully constructs the CrewAI agents and assigns them their respective tasks.
*   **Custom Tooling is active:** Tools wrapping `yfinance` are fully built. They are optimized to return clean string outputs, which is ideal for LLM context windows.
*   **Pipeline Orchestration:** A functional sequential process is implemented in `main.py`, successfully chaining the outputs of the analysts to the Portfolio Manager.
*   **Testing capabilities exist:** Basic test scripts (`test_llm.py`, `test_list_models.py`) are created to verify API connections and model availability.
*   **Milestone Reached:** The presence of a `Mid_Term_Presentation.pptx` file indicates the project has successfully passed its mid-term evaluation phase.

## 5. Future Scope & Enhancements
While the current system is a robust proof-of-concept, there are several avenues for future expansion to make it a production-ready tool:

*   **Dynamic Asset Selection:** Instead of hardcoding the four tech tickers (AAPL, MSFT, NVDA, GOOGL), allow users to input arbitrary tickers via CLI or implement a screener agent to discover stocks dynamically based on criteria.
*   **Alternative Data Integrations:** Integrate APIs for SEC filings (EDGAR), alternative data (e.g., social media sentiment via Twitter/Reddit APIs), or macroeconomic indicators (Federal Reserve data) to give agents a wider worldview.
*   **Backtesting Engine:** Implement a module to test the portfolio manager's historical recommendations against actual historical market performance. This would help refine the agent's prompts and decision-making logic over time.
*   **User Interface (UI):** Develop a web frontend (e.g., using Streamlit, Gradio, or a modern web framework) so non-technical users can easily interact with the system, input tickers, and view the generated markdown reports visually.
*   **Advanced Trading Strategies:** Introduce specialized agents for options trading, short selling, or fixed-income assets to diversify the portfolio beyond long-only equity positions.
*   **Hierarchical Execution:** Refine the CrewAI process from a strictly sequential flow to a hierarchical flow, where a manager agent dynamically delegates tasks to analysts based on intermediate findings, rather than following a rigid step-by-step sequence.
*   **Continuous Monitoring:** Upgrade the script to run persistently, allowing agents to continuously monitor news and prices, sending alerts when a portfolio rebalancing is required.