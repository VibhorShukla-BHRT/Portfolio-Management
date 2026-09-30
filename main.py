import os
from dotenv import load_dotenv
from crewai import Crew, Process
from agents.portfolio_agents import PortfolioAgents
from tasks.portfolio_tasks import PortfolioTasks
import chromadb

# Load environment variables
load_dotenv()

def main():
    print("Welcome to the Next-Generation Multi-Agent Portfolio Management System!")
    print("Initializing AI Agents with OpenRouter and Layered Memory...")
    
    if not os.getenv("OPENROUTER_API_KEY"):
        print("\nERROR: OPENROUTER_API_KEY is not set in the environment.")
        return

    # Initialize Agents and Tasks classes
    agents = PortfolioAgents()
    tasks = PortfolioTasks()

    # Create Agents
    screener = agents.pre_selection_agent()
    quant_agent = agents.quantitative_analyst()
    bull_agent = agents.bull_researcher()
    bear_agent = agents.bear_researcher()
    debate_agent = agents.debate_orchestrator()
    risk_agent = agents.risk_manager()
    portfolio_agent = agents.portfolio_manager()

    # Create Tasks
    screen_task = tasks.pre_selection_task(screener)
    quant_task = tasks.quantitative_analysis_task(quant_agent)
    bull_task = tasks.bull_analysis_task(bull_agent)
    bear_task = tasks.bear_analysis_task(bear_agent)
    debate_task = tasks.debate_task(debate_agent)
    risk_task = tasks.risk_assessment_task(risk_agent)
    strategy_task = tasks.strategy_recommendation_task(portfolio_agent)

    # Set up the Crew
    financial_crew = Crew(
        agents=[screener, quant_agent, bull_agent, bear_agent, debate_agent, risk_agent, portfolio_agent],
        tasks=[screen_task, quant_task, bull_task, bear_task, debate_task, risk_task, strategy_task],
        process=Process.sequential,
        verbose=False
    )

    print("Starting the portfolio analysis process...")
    print("1. Pre-selecting Top Assets")
    print("2. Multi-Agent Debate & Memory Retrieval")
    print("3. Quantitative Black-Litterman / HRP Optimization\n")
    
    result = financial_crew.kickoff()

    print("\n==================================================")
    print("FINAL PORTFOLIO MANAGEMENT STRATEGY")
    print("==================================================\n")
    print(result)

if __name__ == "__main__":
    main()
