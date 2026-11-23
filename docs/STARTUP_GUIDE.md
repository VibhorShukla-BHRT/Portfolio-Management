# MASS Multi-Agent Portfolio Management System — Startup & Testing Guide

This guide walks you through launching the application and testing all key portfolio management features first-hand.

---

## 🚀 Quick Launch (Fastest Way to Test)

The system can run in two modes:

### Mode 1: Unified Server (Recommended)
Serves the complete application (FastAPI backend + compiled React frontend) on a single port:
```bash
# From the project root:
./run_prod.sh
```
* **Frontend Application:** [http://localhost:8000](http://localhost:8000)
* **Paper Trading & Virtual Tracker:** [http://localhost:8000/dummy-invest](http://localhost:8000/dummy-invest)
* **Interactive API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Mode 2: Development Mode (Hot Reloading)
Runs FastAPI with `--reload` and Vite dev server concurrently:
```bash
# From the project root:
./run_dev.sh
```
* **Vite Dev Frontend:** [http://localhost:5173](http://localhost:5173)
* **FastAPI Backend:** [http://localhost:8000](http://localhost:8000)

---

## 📋 Step-by-Step Testing Walkthrough

### 1. Test the Timeline & Performance Graph
1. Open [http://localhost:8000/dummy-invest](http://localhost:8000/dummy-invest) (or click **"Virtual Portfolio Tracker"** in the top navigation).
2. Select an existing portfolio (e.g. `Test Growth Fund` or `US Tech Alpha Portfolio`).
3. **Verify Date Bounding:**
   - Notice the chart's X-axis now starts **strictly on or after the investment start date** (e.g. Nov 02, 2026), rather than showing dates from a year or month before.
   - The badge **"START BOUNDED TO INVESTMENT DATE"** confirms the timeline clamp.
4. **Verify the Benchmark Curve:**
   - Click the **"Benchmark: S&P 500"** (or NIFTY 50) toggle at the bottom right of the chart.
   - Notice the purple dashed curve now appears on the chart, correctly rebased to the portfolio's initial capital so both curves share the same scale.
5. **Switch Timeframes:**
   - Click through `1D`, `1W`, `1M`, `1Y`, and `ALL`.
   - Verify that label intervals adapt dynamically without overlapping.

---

### 2. Test the New "Sell / Liquidation" Feature
1. Scroll down to the **"Active Virtual Holdings & Mark-to-Market"** table.
2. In the rightmost **"ACTION"** column, click the red **`SELL`** button next to any holding (e.g. `NVDA` or `AAPL`).
3. The **Liquidate / Sell Modal** will open displaying:
   - Your current owned shares.
   - The live Yahoo Finance market price.
   - Real-time estimated cash proceeds.
4. Click the quick-fill buttons: `25%`, `50%`, `75%`, or `100%`, or type a custom share amount.
5. Click **"Execute Sell Order"**:
   - The modal executes the order, displays the realized P&L, and auto-refreshes the view.
   - Notice the **"AVAILABLE CASH RESERVE"** at the top immediately increases by the sale proceeds.
   - The holding's shares count decreases (or disappears if 100% liquidated).

---

### 3. Test the Order Execution & Transaction Ledger
1. In the top action bar of the tracker, click the **"Ledger"** button.
2. The **Order Execution & Transaction Ledger** opens right below the holdings table.
3. Verify:
   - Initial portfolio `BUY` orders are logged with units and fill prices.
   - Any `SELL` order you just executed is clearly logged with the exact execution time, fill price, total proceeds, and **Realized P&L** (highlighted in green for gains or red for losses).

---

### 4. Test "Rebalance (AI)" & Cognitive Allocation
1. In the tracker header, click **"Rebalance (AI)"** (or click **"Portfolio Allocator"** in the top navigation).
2. Select your market universe (US S&P 500 / Mag 7 or India NIFTY 50).
3. Set your total investment capital and objective function:
   - **Balanced:** Maximum Sharpe Ratio
   - **Defensive:** Minimum Volatility
   - **Growth:** High Beta Momentum
4. Click **"RUN MULTI-AGENT COGNITIVE ENGINE"**:
   - Watch the 7 CrewAI agents debate upside vs downside risks in the live War Room.
   - Review the final Black-Litterman mathematical weights and discrete share orders in the Order Book.
5. Click **"Deploy to Virtual Tracker (/dummy-invest)"** to instantiate the new optimized portfolio with live mark-to-market tracking.

---

### 5. Test Creating a New Virtual Fund Directly
1. On the `/dummy-invest` page, click **"+ Create New Fund"**.
2. Enter a fund name, select US ($) or India (₹), choose capital, and notice the **Investment Start Date** now automatically defaults to today's date (`2026-11-13`).
3. Click **"Deploy Virtual Fund"**.
4. The new fund is initialized with discrete share allocations proportional to your capital, and its chart trajectory begins cleanly on the current date.

---

## 🛠 Useful CLI Diagnostics & Health Checks

Verify backend status from your terminal:
```bash
# Check API health
curl -s http://localhost:8000/api/health | jq .

# List all paper portfolios
curl -s http://localhost:8000/api/dummy-invest/list | jq .

# View transactions for a portfolio
curl -s http://localhost:8000/api/dummy-invest/<portfolio_id>/transactions | jq .
```
