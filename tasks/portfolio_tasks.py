from crewai import Task

class PortfolioTasks:
    def pre_selection_task(self, agent):
        return Task(
            description=(
                "Use the screen_top_assets tool to fetch the technology universe, "
                "then select the top 4 best-positioned tickers for the current macroeconomic environment."
            ),
            expected_output="A JSON string list of the top 4 tickers to analyze, strictly formatted.",
            agent=agent
        )

    def quantitative_analysis_task(self, agent):
        return Task(
            description=(
                "For the candidate tickers provided by the Pre-Selection Agent, use calculate_technical_indicators "
                "to evaluate 50-day SMA, 200-day SMA, and trend direction. Query long-term memory for relevant technical analogs, "
                "and store any notable technical breakout. Then synthesize a concise quantitative report."
            ),
            expected_output="A quantitative analysis report detailing current indicators and historical context for each candidate ticker.",
            agent=agent
        )

    def bull_analysis_task(self, agent):
        return Task(
            description=(
                "For the candidate tickers, use fetch_company_fundamentals and fetch_stock_news to identify growth catalysts, "
                "positive earnings surprises, and macro tailwinds. Retrieve past bullish memories and produce a focused Bull thesis."
            ),
            expected_output="A report exclusively detailing the bullish arguments and catalysts for each ticker.",
            agent=agent
        )

    def bear_analysis_task(self, agent):
        return Task(
            description=(
                "For the candidate tickers, use fetch_company_fundamentals and fetch_stock_news to examine debt rollover risks, "
                "margin pressures, and regulatory headwinds. Retrieve past bearish memories and produce a focused Bear anti-thesis."
            ),
            expected_output="A report exclusively detailing the bearish arguments, risks, and headwinds for each ticker.",
            agent=agent
        )

    def debate_task(self, agent):
        return Task(
            description=(
                "Review the conflicting reports from the Bull and Bear Researchers, as well as the Quantitative Analyst. "
                "Synthesize an objective, final view on each ticker's expected directional performance. "
                "Conclude with a JSON object strictly formatted as: {'TICKER1': 0.05, 'TICKER2': -0.02, ...}."
            ),
            expected_output=(
                "A balanced summary of the debate for each ticker, concluding with a JSON object representing your expected absolute views. "
                "Format: {'TICKER1': 0.05, 'TICKER2': -0.02, ...} where numbers represent expected returns."
            ),
            agent=agent
        )

    def risk_assessment_task(self, agent):
        return Task(
            description=(
                "Review the finalized views from the Debate Orchestrator. Assess tail risk and structural resilience. "
                "If downside protection is severely compromised, provide a warning to the Chief Portfolio Manager."
            ),
            expected_output="A risk assessment report evaluating the safety of the proposed views.",
            agent=agent
        )

    def strategy_recommendation_task(self, agent):
        return Task(
            description=(
                "Review the Debate Orchestrator's views JSON and candidate tickers. "
                "Invoke calculate_optimal_portfolio tool passing the views JSON and tickers list. "
                "Do NOT hallucinate numerical weights yourself; output the exact weights produced by the tool."
            ),
            expected_output=(
                "A finalized Portfolio Management Strategy Document in markdown containing executive summary and the exact mathematical weights."
            ),
            agent=agent
        )
