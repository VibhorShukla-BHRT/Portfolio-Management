from crewai import Task

class PortfolioTasks:
    def technical_analysis_task(self, agent, tickers):
        return Task(
            description=(
                f"Perform a comprehensive technical analysis on the following tech stocks: {', '.join(tickers)}. "
                "Use the tools provided to fetch historical price data and calculate technical indicators (like 50-day and 200-day SMAs). "
                "Identify if each stock is currently in a bullish or bearish trend."
            ),
            expected_output="A detailed technical analysis report for each ticker, including current price, SMA levels, and a clear 'Bullish', 'Bearish', or 'Neutral' technical rating.",
            agent=agent
        )

    def fundamental_analysis_task(self, agent, tickers):
        return Task(
            description=(
                f"Perform a thorough fundamental analysis on the following tech stocks: {', '.join(tickers)}. "
                "Fetch their company fundamentals (P/E ratio, market cap, profit margins) and search for recent news "
                "that might impact their future growth. Evaluate their valuation and growth prospects."
            ),
            expected_output="A comprehensive fundamental analysis report for each ticker, highlighting key financial metrics, recent news sentiment, and a 'Strong', 'Moderate', or 'Weak' fundamental rating.",
            agent=agent
        )

    def risk_assessment_task(self, agent, tickers):
        return Task(
            description=(
                f"Assess the risks associated with investing in the following tech stocks right now: {', '.join(tickers)}. "
                "Search for macroeconomic risks, sector-specific headwinds, or company-specific controversies. "
                "Consider the current market environment for the technology sector."
            ),
            expected_output="A risk assessment report detailing potential downsides, market risks, and assigning a 'High', 'Medium', or 'Low' risk score for each ticker.",
            agent=agent
        )

    def strategy_recommendation_task(self, agent, tickers):
        return Task(
            description=(
                f"Review the reports from the Quantitative Analyst, Fundamental Analyst, and Risk Manager regarding the following tech stocks: {', '.join(tickers)}. "
                "Synthesize this information to create a final portfolio strategy aimed at profit maximization. "
                "For each ticker, provide a clear, actionable recommendation (BUY, HOLD, or SELL) and a target allocation percentage for a hypothetical $100,000 portfolio."
            ),
            expected_output=(
                "A finalized Portfolio Management Strategy Document formatted in markdown. It must include:\n"
                "1. An executive summary of the tech market.\n"
                "2. A clear BUY/HOLD/SELL recommendation for each ticker with a brief justification.\n"
                "3. A proposed portfolio allocation breakdown (percentages totaling 100%).\n"
                "4. A summary of the main risks to this strategy."
            ),
            agent=agent
        )
