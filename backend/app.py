import os
import sys
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.services.market_service import (
    CURATED_UNIVERSES,
    get_quote,
    get_batch_quotes
)
from backend.services.agent_runner import run_multi_agent_stream
from backend.services.dummy_invest_service import (
    create_paper_portfolio,
    list_paper_portfolios,
    get_paper_portfolio_tracking,
    delete_paper_portfolio,
    update_paper_portfolio_investment_date,
    sell_holding,
    get_portfolio_transactions
)

app = FastAPI(
    title="MASS Autonomous Multi-Agent Portfolio Management API",
    description="Institutional-grade multi-agent asset allocation and convex portfolio optimization engine.",
    version="2.0.0"
)

# Enable CORS for all local development and remote production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class AnalysisRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of stock tickers to analyze, e.g. ['NVDA', 'AAPL', 'MSFT']")
    capital: float = Field(10000.0, description="Total capital to allocate in selected currency")
    strategy_mode: str = Field("balanced", description="Risk profile: 'balanced', 'conservative', or 'aggressive'")
    enable_masking: bool = Field(False, description="MASS Look-Ahead Contamination Shield toggle")
    custom_api_key: Optional[str] = Field(None, description="Optional BYOK API key")

class CreateDummyPortfolioRequest(BaseModel):
    name: str = Field("My MASS Portfolio", description="User-friendly name for portfolio")
    market: str = Field("US", description="'US' or 'IN'")
    currency: str = Field("$", description="'$' or '₹'")
    initial_capital: float = Field(..., description="Initial virtual investment capital")
    holdings: List[Dict[str, Any]] = Field(..., description="List of discrete holdings sized by the optimizer")
    strategy_mode: str = Field("balanced", description="Strategy used: 'balanced', 'conservative', 'aggressive'")
    investment_date: Optional[str] = Field(None, description="Date of initial investment")

class UpdateDateRequest(BaseModel):
    investment_date: str = Field(..., description="Investment date in YYYY-MM-DD format")

class SellHoldingRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol to sell")
    shares: float = Field(..., description="Number of shares to sell")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "MASS Multi-Agent Financial System",
        "academic_affiliation": "Department of CSE, NIT Raipur",
        "author": "Vibhor Shukla (Roll: 23115107)",
        "backend": "Groq LPU (qwen3.8-27b) + PyPortfolioOpt + SQLite"
    }


@app.get("/api/market/universes")
def get_universes():
    """Returns curated US and Indian market universes."""
    return CURATED_UNIVERSES


@app.get("/api/market/quote")
def quote_endpoint(tickers: str = Query(..., description="Comma-separated ticker symbols")):
    """Returns real-time price quotes for given tickers."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    return get_batch_quotes(ticker_list)


@app.post("/api/analyze/stream")
async def stream_analysis(req: AnalysisRequest):
    """
    Server-Sent Events (SSE) streaming endpoint that executes the 7-agent dialectical
    debate and returns continuous convex allocations.
    """
    if not req.tickers:
        raise HTTPException(status_code=400, detail="Must provide at least one ticker.")
        
    generator = run_multi_agent_stream(
        tickers=req.tickers,
        total_capital=req.capital,
        strategy_mode=req.strategy_mode,
        enable_masking=req.enable_masking,
        custom_api_key=req.custom_api_key
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# --- DUMMY INVEST / PAPER TRADING ENDPOINTS ---

@app.post("/api/dummy-invest/create")
def create_dummy_investment(req: CreateDummyPortfolioRequest):
    """Creates a new virtual paper-trading portfolio with real-time tracking."""
    result = create_paper_portfolio(
        name=req.name,
        market=req.market,
        currency=req.currency,
        initial_capital=req.initial_capital,
        holdings=req.holdings,
        strategy_mode=req.strategy_mode,
        investment_date=req.investment_date
    )
    return result

@app.patch("/api/dummy-invest/{portfolio_id}/date")
def update_date_endpoint(portfolio_id: str, req: UpdateDateRequest):
    """Updates the investment date for an existing paper portfolio."""
    success = update_paper_portfolio_investment_date(portfolio_id, req.investment_date)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return {"status": "updated", "portfolio_id": portfolio_id, "investment_date": req.investment_date}


@app.get("/api/dummy-invest/list")
def list_dummy_investments():
    """Returns all user dummy investment portfolios."""
    return list_paper_portfolios()


@app.post("/api/dummy-invest/{portfolio_id}/sell")
def sell_portfolio_holding(portfolio_id: str, req: SellHoldingRequest):
    """Sells shares of a holding from a paper portfolio, updates cash balance, and records transaction."""
    res = sell_holding(portfolio_id, req.ticker, req.shares)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@app.get("/api/dummy-invest/{portfolio_id}/transactions")
def get_portfolio_transaction_history(portfolio_id: str):
    """Returns the full BUY/SELL transaction history for a paper portfolio."""
    return get_portfolio_transactions(portfolio_id)


@app.get("/api/dummy-invest/{portfolio_id}")
def get_dummy_investment(
    portfolio_id: str,
    timeframe: str = Query("ALL", description="Timeframe: 1D, 1W, 1M, 1Y, 5Y, ALL")
):
    """Calculates live mark-to-market performance and unrealized P&L for a paper portfolio."""
    data = get_paper_portfolio_tracking(portfolio_id, timeframe=timeframe)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.delete("/api/dummy-invest/{portfolio_id}")
def delete_dummy_investment(portfolio_id: str):
    """Deletes a paper portfolio."""
    success = delete_paper_portfolio(portfolio_id)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return {"status": "deleted", "portfolio_id": portfolio_id}


# Mount production frontend build assets & SPA fallback
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
def serve_spa(full_path: str):
    """
    Catch-all route that supports Single Page Application (SPA) client-side routing.
    Directly serves static assets if found, or returns index.html for routes like /dummy-invest.
    """
    # Exclude API routes from fallback
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found.")
        
    candidate_file = os.path.join(FRONTEND_DIST, full_path)
    if full_path and os.path.isfile(candidate_file):
        return FileResponse(candidate_file)
        
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
        
    return {"message": "MASS Multi-Agent Portfolio API is running. Build frontend using: cd frontend && npm run build"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
