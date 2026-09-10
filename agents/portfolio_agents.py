from crewai import Agent
from tools.financial_tools import fetch_stock_data, fetch_company_fundamentals, calculate_technical_indicators, fetch_stock_news
import os

class PortfolioAgents:
    def __init__(self):
        # CrewAI uses litellm under the hood for API models
        self.llm = "gemini/gemini-3.6-flash"

    def quantitative_analyst(self):
        return Agent(
            role='Quantitative Financial Analyst',
            goal='Analyze historical price data and technical indicators to identify market trends for tech stocks.',
            backstory=(
                "You are an expert quantitative analyst with decades of experience in algorithmic trading "
                "and technical analysis. You excel at reading chart patterns, moving averages, and momentum indicators "
                "to predict short-term and medium-term price movements."
            ),
            verbose=True,
            allow_delegation=False,
            tools=[fetch_stock_data, calculate_technical_indicators],
            llm=self.llm
        )

    def fundamental_analyst(self):
        return Agent(
            role='Fundamental Equity Analyst',
            goal='Evaluate company financials, valuation metrics, and recent news to determine the intrinsic value of tech stocks.',
            backstory=(
                "You are a seasoned value investor and fundamental analyst. You dissect balance sheets, "
                "P/E ratios, profit margins, and keep a close eye on market news to understand the true health "
                "and future growth potential of technology companies."
            ),
            verbose=True,
            allow_delegation=False,
            tools=[fetch_company_fundamentals, fetch_stock_news],
            llm=self.llm
        )

    def risk_manager(self):
        return Agent(
            role='Risk Management Specialist',
            goal='Assess the downside risk and overall volatility of potential investments in the tech sector.',
            backstory=(
                "You are a strict and cautious risk manager at a top-tier hedge fund. Your primary objective "
                "is capital preservation. You analyze the risks associated with specific stocks, looking at market "
                "conditions, sector volatility, and company-specific red flags."
            ),
            verbose=True,
            allow_delegation=False,
            tools=[fetch_stock_news],
            llm=self.llm
        )

    def portfolio_manager(self):
        return Agent(
            role='Chief Portfolio Manager',
            goal='Synthesize insights from analysts and risk managers to make final asset allocation decisions for profit maximization.',
            backstory=(
                "You are a highly successful hedge fund manager overseeing a multi-million dollar tech portfolio. "
                "You are known for your strategic thinking and ability to balance aggressive profit maximization "
                "with prudent risk management. You make the final call on what to buy, hold, or sell based on comprehensive data."
            ),
            verbose=True,
            allow_delegation=True, # Can ask analysts for more info if needed
            llm=self.llm
        )
