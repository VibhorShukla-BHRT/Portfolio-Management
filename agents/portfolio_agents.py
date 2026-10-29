from crewai import Agent, LLM
import os
from tools.financial_tools import fetch_stock_data, fetch_company_fundamentals, calculate_technical_indicators, fetch_stock_news
from tools.optimization_tools import calculate_optimal_portfolio
from tools.memory_tools import store_memory, retrieve_memory
from tools.screening_tools import screen_top_assets

class PortfolioAgents:
    def __init__(self):
        if os.getenv("LLM_BASE_URL"):
            model = os.getenv("LLM_MODEL", "ollama/ritu-27b:latest")
            api_key = os.getenv("LLM_API_KEY", "ollama")
            base_url = os.getenv("LLM_BASE_URL")
        elif os.getenv("OPENROUTER_API_KEY"):
            # Prefer explicit OPENROUTER_MODEL or default to openrouter/free
            candidate_model = os.getenv("OPENROUTER_MODEL") or os.getenv("LLM_MODEL", "")
            if not candidate_model or candidate_model.startswith("ollama"):
                model = "openrouter/openrouter/free"
            else:
                model = candidate_model
            api_key = os.getenv("OPENROUTER_API_KEY")
            base_url = "https://openrouter.ai/api/v1"
        else:
            raise RuntimeError(
                "No valid LLM backend configured! Please configure OPENROUTER_API_KEY or "
                "LLM_BASE_URL in your .env file (see .env.example for template)."
            )
        
        self.llm = LLM(
            model=model,
            api_key=api_key,
            base_url=base_url,
            timeout=900,
            stream=True
        )

    def pre_selection_agent(self):
        return Agent(
            role='Universe Screener and Asset Ranker',
            goal='Dynamically rank a broad universe of stocks and select the top N for deep analysis.',
            backstory=(
                "You are an expert quantitative screener. Instead of analyzing hardcoded tickers, "
                "you evaluate sectors and macroeconomic trends to select the most promising assets "
                "using listwise relative ranking techniques."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=2,
            tools=[screen_top_assets],
            llm=self.llm
        )

    def quantitative_analyst(self):
        return Agent(
            role='Quantitative Financial Analyst',
            goal='Analyze historical price data and technical indicators to identify market trends.',
            backstory=(
                "You are an expert quantitative analyst. You excel at reading chart patterns, "
                "moving averages, and high-frequency data to predict price movements. You use layered memory to compare current setups with historical ones."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=3,
            tools=[fetch_stock_data, calculate_technical_indicators, retrieve_memory, store_memory],
            llm=self.llm
        )

    def bull_researcher(self):
        return Agent(
            role='Bull Market Researcher',
            goal='Identify catalysts for growth, undervalued metrics, and positive market sentiment.',
            backstory=(
                "You are a perma-bull analyst. Your job is to find reasons why an asset will appreciate. "
                "You look for strong balance sheets, positive earnings surprises, and macro tailwinds."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=3,
            tools=[fetch_company_fundamentals, fetch_stock_news, retrieve_memory],
            llm=self.llm
        )

    def bear_researcher(self):
        return Agent(
            role='Bear Market Researcher',
            goal='Uncover balance sheet weaknesses, macro headwinds, and overbought technical indicators.',
            backstory=(
                "You are a skeptical short-seller. Your job is to find reasons why an asset will decline. "
                "You rigorously hunt for debt risks, deteriorating margins, and negative sentiment."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=3,
            tools=[fetch_company_fundamentals, fetch_stock_news, retrieve_memory],
            llm=self.llm
        )

    def debate_orchestrator(self):
        return Agent(
            role='Debate Orchestrator',
            goal='Synthesize the conflicting viewpoints of the Bull and Bear researchers to arrive at a balanced, objective truth.',
            backstory=(
                "You are a rigorous managing director. You listen to both the Bull and Bear analysts, "
                "force them to weigh opposing facts, and strip away emotional bias and hallucinations to produce a definitive qualitative view on the asset."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=2,
            llm=self.llm
        )

    def risk_manager(self):
        return Agent(
            role='Risk Management Specialist',
            goal='Assess tail risk, historical drawdowns, and structural resilience of the proposed views.',
            backstory=(
                "You are a strict risk manager focusing on Conditional Value at Risk and extreme drawdowns. "
                "You override bullish exuberance if downside protection is compromised."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=2,
            tools=[fetch_stock_news, retrieve_memory],
            llm=self.llm
        )

    def portfolio_manager(self):
        return Agent(
            role='Chief Portfolio Manager',
            goal='Translate qualitative views into mathematically optimal weights using the Black-Litterman model or Hierarchical Risk Parity.',
            backstory=(
                "You do NOT hallucinate numerical weights. You collect the finalized views from the Debate Orchestrator, "
                "format them into a JSON of expected absolute returns, and execute the quantitative optimization tool to construct the portfolio mathematically."
            ),
            verbose=False,
            allow_delegation=False,
            max_iter=4,
            tools=[calculate_optimal_portfolio],
            llm=self.llm
        )
