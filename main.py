import os
from dotenv import load_dotenv
from crewai import Crew, Process
from agents.portfolio_agents import PortfolioAgents
from tasks.portfolio_tasks import PortfolioTasks

# Load environment variables
load_dotenv()

def main():
    print("Welcome to the Multi-Agent Portfolio Management System!")
    print("Initializing AI Agents with Google Gemini...")
    
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("\nERROR: GEMINI_API_KEY is not set in the environment.")
        print("Please create a .env file with your GEMINI_API_KEY and try again.")
        return

    # Define the target tech stocks
    tickers = ["AAPL", "MSFT", "NVDA", "GOOGL"]
    print(f"\nTarget Assets for Analysis: {', '.join(tickers)}\n")

    # Initialize Agents and Tasks classes
    agents = PortfolioAgents()
    tasks = PortfolioTasks()

    # Create Agents
    quant_agent = agents.quantitative_analyst()
    fund_agent = agents.fundamental_analyst()
    risk_agent = agents.risk_manager()
    portfolio_agent = agents.portfolio_manager()

    # Create Tasks
    tech_task = tasks.technical_analysis_task(quant_agent, tickers)
    fund_task = tasks.fundamental_analysis_task(fund_agent, tickers)
    risk_task = tasks.risk_assessment_task(risk_agent, tickers)
    strategy_task = tasks.strategy_recommendation_task(portfolio_agent, tickers)

    # Set up the Crew
    # We use a sequential process where the Portfolio Manager gets the results from the other analysts
    financial_crew = Crew(
        agents=[quant_agent, fund_agent, risk_agent, portfolio_agent],
        tasks=[tech_task, fund_task, risk_task, strategy_task],
        process=Process.sequential,
        verbose=True
    )

    print("Starting the portfolio analysis process. This may take a few minutes as the agents research, analyze, and debate...\n")
    
    # Execute the crew workflow
    result = financial_crew.kickoff()

    print("\n==================================================")
    print("FINAL PORTFOLIO MANAGEMENT STRATEGY")
    print("==================================================\n")
    print(result)

if __name__ == "__main__":
    main()
