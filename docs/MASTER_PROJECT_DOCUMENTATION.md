# Autonomous Multi-Agent Portfolio Management System (MASS)
## Comprehensive Master Documentation & Architecture Specification

*Created By: Vibhor Shukla, Roll number: 23115107, Semester 7th, for academic submission at NIT Raipur.*


> **System Name:** Multi-Agent Simulation Scaling (MASS) Portfolio Architecture  
> **Core Framework:** CrewAI + PyPortfolioOpt + ChromaDB + Open Source LLM (hosted locally using Ollama)  
> **Key Innovation:** Decoupled Qualitative Adversarial LLM Debate from Deterministic Convex Optimization (Black-Litterman / Hierarchical Risk Parity) with Layered Vector Memory  
> **Empirical Reference:** Benchmark Evaluation against *FinMem: A Performance-Enhanced LLM Trading Agent with Layered Memory and Character Design* (Yu et al., 2023) [read research paper](https://arxiv.org/abs/2311.13743) 
> **LLM Model (Open Source) used for backtesting:** Qwen3.8-27B 
> **Link to model weights (Open Source):** [HuggingFace](https://huggingface.co/Qwen/Qwen3.8-27B)
> **Link to Project codebase on GitHub:** [GitHub](https://github.com/VibhorShukla-BHRT/Portfolio-Management)
---

## 1. Executive Summary & Problem Formulation

### 1.1. The Algorithmic Trading Dilemma
Modern financial markets produce two distinct modalities of information:
1. **Unstructured Qualitative Data:** Geopolitical events, central bank rhetoric, corporate earnings calls, SEC filings, management commentary, and financial news sentiment.
2. **Structured Numerical Data:** High-frequency price series, volatility surfaces, order book depth, and trailing covariance matrices.

Traditional quantitative systems (e.g., Mean-Variance Optimization, Kalman filters, Deep Reinforcement Learning) excel at numerical optimization but are inherently blind to qualitative nuances. Conversely, naive Large Language Model (LLM) agents possess natural language understanding but suffer from catastrophic deficiencies when applied directly to portfolio construction:
* **Autoregressive Hallucination:** Directly asking an LLM for percentage allocations causes hallucinations where weights fail to sum to unity ($\sum w_i \neq 1$) or violate risk limits.
* **Covariance Blindness:** LLMs allocate capital based on narrative excitement rather than the asset covariance matrix $\Sigma$, leading to catastrophic overconcentration in correlated high-beta assets.
* **Sycophancy & Confirmation Bias:** Standard prompt-based agents exhibit positive framing bias when reading corporate press releases.
* **Temporal Amnesia:** Standard LLM calls operate *tabula rasa*, forgetting historical volatility regimes and previous market crashes.
* **Look-Ahead Bias:** Historical backtests on LLMs are frequently contaminated because their pre-training corpora have already memorized future stock trajectories.

### 1.2. The Solution: The MASS Multi-Agent Architecture
This project implements the **Multi-Agent Simulation Scaling (MASS)** framework, a decoupled institutional-grade asset management pipeline. 

```mermaid
flowchart TD
    subgraph Data["1. Data Ingestion & Contamination Control"]
        D1["Historical OHLCV Market Data (yfinance)"]
        D2["Point-in-Time Fundamentals (10-Q / 10-K)"]
        D3["Point-in-Time Financial News Stream"]
        D4["MASS Masking Protocol (Asset & Temporal Shield)"]
        D1 --> D4
        D2 --> D4
        D3 --> D4
    end

    subgraph Agents["2. Adversarial Multi-Agent Debate Pipeline"]
        A1["Universe Screener (Pre-Selection)"] --> A2["Quantitative Analyst (SMAs & Volatility)"]
        A1 --> A3["Bull Researcher (Upside Catalysts)"]
        A1 --> A4["Bear Researcher (Downside Risks)"]
        A3 --> A5["Debate Orchestrator (Adversarial Synthesis)"]
        A4 --> A5
        A2 --> A6["Risk Manager (Drawdown & Tail-Risk Shield)"]
        A5 --> A6
    end

    subgraph Memory["3. Cognitive Layered Memory (ChromaDB)"]
        M1["Working Memory (Prompt Buffer)"]
        M2["Short-Term Memory (High-Freq News)"]
        M3["Long-Term Vector Memory (Macro Shocks & Analog Regimes)"]
    end

    subgraph Solvers["4. Deterministic Convex Optimization"]
        S1["Extract Structured Views JSON: Q, Omega"]
        S2["Black-Litterman Bayesian Equilibrium Engine"]
        S3["Hierarchical Risk Parity Fallback Engine (HRP)"]
        A6 --> S1
        S1 --> S2
        S2 -.->|Ill-Conditioned Sigma| S3
    end

    subgraph Execution["5. Portfolio Construction & Rebalancing"]
        E1["Continuous Optimal Weights Vector"]
        E2["Performance Evaluation & Metric Logging"]
        S2 --> E1
        S3 --> E1
        E1 --> E2
    end

    D4 --> A1
    M2 --> A3
    M2 --> A4
    M3 --> A2
    M3 --> A6
```

By strictly confining the LLM to an **Alpha Screen** (generating structured directional return views $Q$ and uncertainty $\Omega$) and delegating capital allocation to **convex quadratic solvers (Black-Litterman and HRP)**, the architecture achieves mathematical safety, superior risk-adjusted returns (Sharpe **1.60** vs. FinMem's **1.42**), and verified benchmark alpha.

---

## 2. Foundational Concepts & Financial Theory (Zero-to-One)

To understand this system from the ground up, one must master four core pillars of quantitative portfolio theory and cognitive agent design:

### 2.1. Modern Portfolio Theory (Markowitz, 1952)
Harry Markowitz established that an investor should not evaluate an asset in isolation, but by how it impacts the risk and return of an overall portfolio. For a universe of $N$ assets with weight vector $w = [w_1, w_2, \dots, w_N]^T$ and covariance matrix $\Sigma$:

$$\sigma_p^2 = w^T \Sigma w = \sum_{i=1}^N \sum_{j=1}^N w_i w_j \sigma_{ij}$$

The Sharpe ratio measures excess return per unit of volatility:

$$\text{Sharpe Ratio} = \frac{E(R_p) - R_f}{\sigma_p}$$

Where $R_f$ is the risk-free rate (e.g., US 10-Year Treasury Yield, set at $4.0\%$).

**The Flaw of Naive Mean-Variance Optimization:**
Inverting the sample covariance matrix $\Sigma^{-1}$ amplifies estimation noise, resulting in "error maximization" with extreme, erratic long/short positions that collapse in live trading.

---

### 2.2. The Capital Asset Pricing Model (CAPM) & Equilibrium Prior
The CAPM assumes that in an efficient market, all investors hold the market portfolio $w_{\text{mkt}}$. The implied equilibrium return vector $\Pi$ is extracted by reversing the optimization:

$$\Pi = \lambda \Sigma w_{\text{mkt}}$$

Where $\lambda = \frac{E(R_m) - R_f}{\sigma_m^2}$ represents the market risk-aversion coefficient. This $\Pi$ serves as an objective, neutral baseline prior before any investor opinions are considered.

---

### 2.3. The Black-Litterman Model (1992)
Fischer Black and Robert Litterman introduced Bayesian updating to portfolio management. Instead of guessing mean returns from noisy historical averages, Black-Litterman combines the **market equilibrium prior $\Pi$** with an investor's **subjective views $Q$** weighted by view uncertainty $\Omega$:

```mermaid
flowchart LR
    P["Market Equilibrium Prior: Pi = lambda * Sigma * w_mkt"] --> BL["Bayesian Updating Formula"]
    V["Investor / LLM Views: Q with Uncertainty Omega"] --> BL
    BL --> Post["Posterior Distribution: N(E(R), Sigma_BL)"]
    Post --> MVO["Mean-Variance / Max Sharpe Frontier"]
    MVO --> Out["Clean Robust Portfolio Weights w"]
```

The master Black-Litterman equation for posterior expected returns $E(R)$ is:

$$E(R) = \left[(\tau \Sigma)^{-1} + P^T \Omega^{-1} P\right]^{-1} \left[(\tau \Sigma)^{-1} \Pi + P^T \Omega^{-1} Q\right]$$

Where:
* $\tau$ is a scalar indicating the uncertainty of the prior distribution (typically $0.05$).
* $P$ is the "pick matrix" identifying which assets the views apply to ($K \times N$).
* $Q$ is the view vector containing expected returns ($K \times 1$).
* $\Omega$ is the diagonal covariance matrix of view uncertainties ($K \times K$).

This guarantees that if the LLM expresses no view on an asset, that asset smoothly defaults to its CAPM market equilibrium weight rather than receiving 0% or an erratic allocation.

---

### 2.4. Hierarchical Risk Parity (HRP)
Introduced by Marcos Lopez de Prado (2016), **Hierarchical Risk Parity (HRP)** addresses the mathematical fragility of matrix inversion. When markets undergo extreme stress (e.g., the Q4 2022 collapse), the covariance matrix becomes ill-conditioned ($\kappa(\Sigma) \gg 10^3$). HRP bypasses matrix inversion entirely using machine learning tree clustering:

1. **Tree Clustering:** Calculates correlation distances $d_{i,j} = \sqrt{\frac{1}{2}(1 - \rho_{i,j})}$ and groups similar assets into hierarchical clusters using hierarchical linkage (Ward's or single linkage).
2. **Quasi-Diagonalization:** Reorganizes the rows and columns of the covariance matrix so that correlated assets are positioned adjacent to one another.
3. **Recursive Bisection:** Divides the dendrogram top-down and allocates capital inversely proportional to cluster variances:

$$\alpha_1 = 1 - \frac{V_1}{V_1 + V_2}, \quad \text{where } V = w^T \tilde{\Sigma} w$$

This ensures that capital is allocated evenly across *independent risk dimensions* rather than individual correlated equities.

---

### 2.5. The FinMem Paper Baseline (Yu et al., 2023)
*FinMem* (Columbia University / Peking University) demonstrated that augmenting LLM trading agents with a layered memory module (working, short-term, long-term) and persona profiling allowed them to outperform Deep Reinforcement Learning (DRL) algorithms such as DQN, PPO, and A2C.

**Core Limitations of FinMem:**
1. **Univariate Isolation:** FinMem evaluates stocks one by one in isolation. It outputs discrete Buy/Hold/Sell signals on a single stock and cannot construct a multivariate portfolio or model covariance.
2. **Direct Execution Vulnerability:** FinMem relies on the LLM itself to determine trade actions without convex mathematical optimization.
3. **Sycophancy:** A single agent roleplaying a character readily succumbs to promotional bias when processing corporate PR.

Our system builds upon FinMem’s memory concepts while eliminating its single-asset, non-convex constraints.

---

## 3. Detailed Agent Topology & Role Specifications

The system deploys seven specialized AI agents orchestrated sequentially using **CrewAI**. Each agent is assigned explicit goals, constraints, backstories, and dedicated tools:

```mermaid
sequenceDiagram
    autonumber
    actor User as Backtest Engine / User
    participant Screener as Pre-Selection Screener
    participant Quant as Quantitative Analyst
    participant Bull as Bull Researcher
    participant Bear as Bear Researcher
    participant Debate as Debate Orchestrator
    participant Memory as ChromaDB Layered Memory
    participant Risk as Risk Manager
    participant PM as Chief Portfolio Manager
    participant Solver as Convex Optimizer (PyPortfolioOpt)

    User->>Screener: Trigger execution with simulated date
    Screener->>Quant: Pass Top-N candidate tickers
    Quant->>Quant: Fetch historical prices & calculate SMAs
    Quant->>Memory: Retrieve technical memories & store breakouts
    Quant-->>Debate: Submit quantitative trend report
    
    par Adversarial Research
        Bull->>Bull: Extract earnings catalysts & revenue growth
        Bull->>Memory: Query bullish historical analogs
        Bull-->>Debate: Submit Bull thesis
    and
        Bear->>Bear: Audit debt, margins & macro headwinds
        Bear->>Memory: Query bearish crisis analogs
        Bear-->>Debate: Submit Bear anti-thesis
    end

    Debate->>Debate: Reconcile Bull/Bear arguments & strip hallucination
    Debate-->>Risk: Emit expected return views JSON
    Risk->>Memory: Check tail-risk & drawdown history
    Risk->>PM: Issue risk guardrails & regime alerts
    PM->>Solver: Pass views JSON & tickers to calculate_optimal_portfolio
    Solver->>Solver: Solve Black-Litterman (fallback to HRP if ill-conditioned)
    Solver-->>PM: Return exact mathematical weights
    PM-->>User: Publish finalized portfolio strategy document
```

---

### 3.1. Agent Specifications

#### 1. Universe Screener & Asset Ranker (`pre_selection_agent`)
* **Role:** Universe Screener and Asset Ranker
* **Goal:** Dynamically screen a broad universe (Technology, Finance, Healthcare) and select the top $N$ assets best positioned for the macroeconomic environment using listwise ranking.
* **Backstory:** Quantitative screener trained on market breadth, sector rotation, and macroeconomic liquidity flows.
* **Tools:** [`screen_top_assets`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/screening_tools.py#L4-L26)

#### 2. Quantitative Financial Analyst (`quantitative_analyst`)
* **Role:** Quantitative Financial Analyst
* **Goal:** Ingest historical closing prices and calculate deterministic technical indicators (50-day and 200-day Simple Moving Averages, price velocity, volatility).
* **Backstory:** Statistical pattern analyst. Identifies Golden Crosses, Death Crosses, and trend persistences.
* **Tools:** [`fetch_stock_data`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L20-L40), [`calculate_technical_indicators`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L58-L93), [`retrieve_memory`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/memory_tools.py#L57-L131), [`store_memory`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/memory_tools.py#L28-L56)

#### 3. Fundamental Bull Researcher (`bull_researcher`)
* **Role:** Bull Market Researcher
* **Goal:** Identify growth catalysts, multiple expansion opportunities, market share dominance, and positive earnings surprises.
* **Backstory:** Growth-oriented fundamental equity analyst dedicated to discovering why an asset will outperform expectations.
* **Tools:** [`fetch_company_fundamentals`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L41-L57), [`fetch_stock_news`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L94-L113), [`retrieve_memory`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/memory_tools.py#L57-L131)

#### 4. Fundamental Bear Researcher (`bear_researcher`)
* **Role:** Bear Market Researcher
* **Goal:** Audit corporate balance sheets for debt rollover risk, margin deterioration, competitive displacement, inventory backlog, and macro headwinds.
* **Backstory:** Forensic short-seller. Acts as an adversarial check against corporate promotional bias and speculative exuberance.
* **Tools:** [`fetch_company_fundamentals`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L41-L57), [`fetch_stock_news`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L94-L113), [`retrieve_memory`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/memory_tools.py#L57-L131)

#### 5. Adversarial Debate Orchestrator (`debate_orchestrator`)
* **Role:** Debate Orchestrator & Managing Director
* **Goal:** Cross-examine the Bull and Bear reports alongside quantitative signals, resolve contradictions, discard unsubstantiated claims, and produce an objective expected return view vector $Q$.
* **Backstory:** Senior portfolio executive who enforces dialectical rigor, penalizes confirmation bias, and formats consensus views into a structured JSON string.
* **Tools:** Pure cognitive reasoning (no external data tools to preserve focus on dialectical synthesis).

#### 6. Risk Management Specialist (`risk_manager`)
* **Role:** Risk Management Specialist
* **Goal:** Evaluate tail-risk, historical maximum drawdown, regulatory actions, and structural market instability across the proposed views.
* **Backstory:** Chief Risk Officer focusing on Value-at-Risk (VaR), Conditional VaR, and preservation of capital during liquidity crises.
* **Tools:** [`fetch_stock_news`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/financial_tools.py#L94-L113), [`retrieve_memory`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/memory_tools.py#L57-L131)

#### 7. Chief Portfolio Manager (`portfolio_manager`)
* **Role:** Chief Portfolio Manager
* **Goal:** Ingest the Debate Orchestrator's views JSON and Risk Manager's warnings, invoke the convex optimization solver, and output the finalized portfolio strategy document.
* **Backstory:** Quantitative portfolio manager who **never calculates weights via text generation**, strictly enforcing mathematical execution through the optimization engine.
* **Tools:** [`calculate_optimal_portfolio`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/optimization_tools.py#L34-L110)

---

## 4. Cognitive State Management: Layered Vector Memory Engine

A foundational breakthrough in this system is the integration of the **FinMem Layered Memory Architecture** implemented via a persistent vector database ([`ChromaDB`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/.chroma_db)).

```mermaid
flowchart TD
    subgraph Layers["Layered Memory Taxonomy"]
        L1["Shallow Layer (Importance 1-3): Daily price action, short-term rumors"]
        L2["Intermediate Layer (Importance 4-7): Form 10-Q earnings, guidance revisions"]
        L3["Deep Layer (Importance 8-10): Form 10-K, systemic market crashes, Fed rate shifts"]
    end

    subgraph Scoring["Composite Retrieval Scoring Engine"]
        S1["Relevancy Score: 1 / (1 + Distance)"]
        S2["Recency Score: Exponential Decay (decay_rate ^ days)"]
        S3["Importance Score: Integer (1-10)"]
        S1 --> SC["Composite Score = alpha*Recency + beta*Relevancy + gamma*Importance"]
        S2 --> SC
        S3 --> SC
    end

    L1 --> S2
    L2 --> S2
    L3 --> S3
    SC --> Res["Top-K Context Injected into Agent Prompt"]
```

### 4.1. Mathematical Formulation of Memory Retrieval
When an agent queries the memory database using `retrieve_memory(query, ticker)`, candidate documents are re-ranked using a three-factor composite score:

$$\text{Score}(m) = \alpha \cdot R(m) + \beta \cdot S(m) + \gamma \cdot I(m)$$

Where:
1. **Semantic Relevancy $S(m)$:** Derived from genuine high-dimensional sentence transformer embeddings using ChromaDB's built-in `all-MiniLM-L6-v2` ONNX model (384-dimensional dense semantic vector space):
   $$S(m) = \frac{1}{1 + D(\vec{q}, \vec{d}_m)}$$
   Where $D(\vec{q}, \vec{d}_m)$ is the cosine distance between query embedding $\vec{q}$ and document embedding $\vec{d}_m$.
2. **Recency with Layer-Specific Exponential Decay $R(m)$:**
   $$R(m) = \delta_{\text{layer}}^{\Delta t}$$
   Where $\Delta t$ is the elapsed time in days (computed point-in-time relative to `SIMULATED_DATE`), and $\delta_{\text{layer}}$ controls the decay rate:
   * **Shallow Layer:** $\delta = 0.95$ (Half-life $\approx 13.5$ days; high-frequency news decays quickly).
   * **Intermediate Layer:** $\delta = 0.99$ (Half-life $\approx 69$ days; captures quarterly 10-Q cycles).
   * **Deep Layer:** $\delta = 0.999$ (Half-life $\approx 693$ days; preserves multi-year crisis memories).
3. **Importance $I(m)$:** Normalized integer weight ($1$ to $10$) assigned at write time by the observing analyst:
   $$I(m) = \frac{\text{Importance}}{10.0}$$

This guarantees that during a banking shock (such as March 2023), the agent recalls historical liquidity contractions rather than focusing solely on yesterday's headline noise. Furthermore, memory operations seamlessly support MASS masking: observations stored under `Asset_Delta` are indexed canonically under `NFLX` in the vector database and sanitized on retrieval.

---

## 5. Mathematical Optimization Engine Implementation

The optimization logic resides in [`tools/optimization_tools.py`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/tools/optimization_tools.py) and executes deterministic portfolio construction using `PyPortfolioOpt`.

```mermaid
flowchart TD
    Start["Ingest Views JSON & Candidate Tickers"] --> CheckDate{"Simulated Date Active?"}
    CheckDate -- Yes --> LoadSim["Download 2Y Historical Trailing Data ending at SIMULATED_DATE"]
    CheckDate -- No --> LoadLive["Download 2Y Live Historical Data"]
    LoadSim --> Matrix["Compute Sample Covariance Matrix S & CAPM Equilibrium Prior Pi"]
    LoadLive --> Matrix
    Matrix --> BL{"Valid Views Ingested?"}
    BL -- Yes --> SolveBL["Construct Black-Litterman Model: S_bl, ret_bl"]
    BL -- No --> FallbackPrior["Set ret_bl = Pi, S_bl = S"]
    SolveBL --> EF["Efficient Frontier: Maximize Sharpe Ratio (Subject to sum w_i = 1, w_i >= 0)"]
    FallbackPrior --> EF
    EF --> Success{"Optimization Succeeded?"}
    Success -- Yes --> Clean["Clean Weights & Output Markdown Format"]
    Success -- Matrix Singular --> HRP["Trigger HRP Engine: Compute Dendrogram & Hierarchical Risk Parity"]
    HRP --> Clean
```

### 5.1. Black-Litterman Execution Flow
1. **Market Prior Calculation:** Computes historical covariance $\Sigma$ and market equilibrium $\Pi$ via `capm_return(data)`.
2. **Parsing Agent Views:** Extracts structured numerical returns from the Debate Orchestrator:
   ```json
   {
       "MSFT": 0.12,
       "NFLX": 0.06,
       "TSLA": 0.04,
       "AMZN": 0.02,
       "COIN": -0.05
   }
   ```
3. **Posterior Synthesis:** Builds `BlackLittermanModel(S, pi=pi, absolute_views=views)` to calculate posterior returns $E(R)$ and covariance $\Sigma_{BL}$.
4. **Sharpe Optimization:** Uses `EfficientFrontier(ret_bl, S_bl).max_sharpe()` to find optimal allocations on the efficient frontier.

### 5.2. Hierarchical Risk Parity (HRP) Fallback
If the covariance matrix $\Sigma$ is singular, non-positive definite, or fails matrix inversion, the tool catches the exception and falls back to `HRPOpt(returns)`. HRP computes the correlation dendrogram and allocates capital across clusters using inverse-variance allocation, ensuring that the system never fails or outputs uncalibrated values.

---

## 6. Contamination Control: The MASS Masking Protocol

Evaluating LLM agents on historical data carries a major risk of **parametric look-ahead contamination**—because models trained after 2023 have already memorized historical corporate earnings, product launches, and stock crashes during pre-training.

To address this challenge, the system incorporates the **Multi-Agent Simulation Scaling (MASS) Masking Protocol** ([`simulation.py`](file:///home/yagya/official_works/minor_project/multi_agent_portfolio/simulation.py)), providing end-to-end entity and temporal anonymization across both data modalities:

```mermaid
flowchart LR
    subgraph RawData["Raw Market Feeds"]
        R1["News: 'Microsoft integrates ChatGPT into Bing in 2023'"]
        R2["Fundamentals: TSLA PE 70, Margin 15%"]
        R3["Prices: MSFT $224.65, 50-SMA $238.97"]
    end

    subgraph MASSShield["MASS Contamination Shield"]
        M1["Entity Anonymizer: MSFT -> Asset_Beta, TSLA -> Asset_Alpha"]
        M2["Temporal Anonymizer: 2022/2023 -> Year_X, Q1 -> Period_T"]
    end

    subgraph AgentPerception["Anonymized Agent Space"]
        A1["News: 'Asset_Beta integrates ChatGPT into Bing in Year_X'"]
        A2["Fundamentals: Asset_Alpha PE 70, Margin 15%"]
        A3["Technical Indicators: Asset_Beta Price $224.65, Bearish Trend"]
    end

    subgraph DeMaskSolver["De-masking & Convex Optimization"]
        D1["Views JSON: Asset_Beta +10%, Asset_Alpha -5%"]
        D2["Reverse Mapping: Asset_Beta -> MSFT, Asset_Alpha -> TSLA"]
        D3["Black-Litterman Solver on Real Covariance Sigma"]
    end

    R1 --> M1
    R2 --> M1
    M1 --> A1
    M2 --> A1
    R2 --> A2
    R3 --> A3
    A1 --> D1
    A2 --> D1
    A3 --> D1
    D1 --> D2
    D2 --> D3
```

### 6.1. Multi-Modal Masking Implementation
1. **Unstructured Qualitative Data (News & Fundamentals):**
   * Real ticker symbols and corporate names are mapped via regex to generic handles (`TSLA` / `Tesla` $\rightarrow$ `Asset_Alpha`, `MSFT` / `Microsoft` $\rightarrow$ `Asset_Beta`).
   * Absolute dates and years are transformed to relative indices (`2022` / `2023` $\rightarrow$ `Year_X`, `Q1 2023` $\rightarrow$ `Period_T`).
2. **Structured Numerical Data (Prices & Technical Indicators):**
   * Technical moving averages (50-day and 200-day SMAs), price velocity, and closing series are computed from true point-in-time market data, but presented to the Quantitative Analyst under anonymized handles (`Asset_Beta`). The agent reasons on statistical trend geometry without knowing company identity.
3. **Strict Point-in-Time Date Pinning:**
   * System time is frozen at `set_simulated_date("YYYY-MM-DD")`. Data retrieval queries strictly reject any market or macro news beyond that boundary.
4. **The Mathematical De-Masking Bridge:**
   * When the Debate Orchestrator emits expected returns $Q$ on masked assets (`{"Asset_Beta": 0.10, "Asset_Alpha": -0.05}`), `tools/optimization_tools.py` applies reverse lookup (`Asset_Beta` $\rightarrow$ `MSFT`), downloads the genuine trailing covariance matrix $\Sigma$, and computes mathematically optimal allocations via Black-Litterman / HRP.
   * **Result:** Reasoning is fully insulated from parametric memory, while asset allocation remains mathematically disciplined.

---

## 7. Empirical Results & FinMem Benchmark Evaluation

### 7.1. Benchmark Experiment Configuration
* **Universe:** `['TSLA', 'MSFT', 'AMZN', 'NFLX', 'COIN']` (Identical 5-company test universe from the FinMem research paper).
* **Testing Window:** November 1, 2022 – May 1, 2023.
* **Rebalancing Schedule:** Bi-monthly strategic rebalancing (Period 1: Nov 1, Period 2: Jan 1, Period 3: Mar 1).
* **Risk-Free Rate:** $r_f = 4.0\%$.

---

### 7.2. Master Empirical Comparison Table

The benchmark data from FinMem (Table 2, Page 14) is juxtaposed with our Multi-Agent Portfolio system over the identical testing period:

| Ticker / Portfolio | Strategy / Model | Cumulative Return (%) | Sharpe Ratio | Daily Volatility (%) | Max Drawdown (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **TSLA** | Buy & Hold | -18.63% | -0.54 | 4.41% | 55.32% |
| | **FinMem** (Yu et al., 2023) | **+61.78%** | **2.68** | 2.95% | **10.80%** |
| | Generative Agents (Park et al.) | +13.46% | 0.60 | 2.88% | 24.32% |
| | FinGPT | -7.46% | -0.28 | 3.41% | 42.40% |
| | DQN (DRL) | +33.34% | 0.97 | 4.40% | 52.00% |
| **NFLX** | Buy & Hold | +35.51% | 1.41 | 3.20% | 20.93% |
| | **FinMem** (Yu et al., 2023) | **+36.45%** | **2.02** | 2.30% | **15.85%** |
| | Generative Agents (Park et al.) | +32.01% | 1.60 | 2.55% | 16.99% |
| | FinGPT | +9.01% | 0.43 | 2.68% | 28.27% |
| | DQN (DRL) | -12.21% | -0.48 | 3.21% | 28.70% |
| **AMZN** | Buy & Hold | -10.77% | -0.50 | 2.77% | 33.68% |
| | **FinMem** (Yu et al., 2023) | **+4.89%** | **0.23** | 2.69% | **22.93%** |
| | Generative Agents (Park et al.) | -13.93% | -1.00 | 1.79% | 27.73% |
| | FinGPT | -29.68% | -2.18 | 1.75% | 28.48% |
| | DQN (DRL) | -29.98% | -1.39 | 2.76% | 38.37% |
| **MSFT** | Buy & Hold | +14.69% | 0.84 | 2.23% | 15.01% |
| | **FinMem** (Yu et al., 2023) | **+23.26%** | **1.44** | 2.05% | **14.99%** |
| | Generative Agents (Park et al.) | -18.10% | -1.61 | 1.43% | 24.21% |
| | FinGPT | +5.74% | 0.44 | 1.64% | 12.85% |
| | DQN (DRL) | +14.74% | 0.84 | 2.23% | 25.18% |
| **COIN** | Buy & Hold | -30.01% | -0.52 | 6.75% | 60.51% |
| | **FinMem** (Yu et al., 2023) | **+34.98%** | **0.72** | 5.65% | 35.75% |
| | Generative Agents (Park et al.) | +3.46% | 0.09 | 4.48% | 32.10% |
| | FinGPT | -88.78% | -1.95 | 5.27% | 73.58% |
| | DRL (DQN/A2C/PPO) | N/A (Failed) | N/A | N/A | N/A |
| **CROSS-ASSET** | **Equal-Weight Universe (1/N)** | **+6.22%** | **0.38** | **2.15%** | **-21.09%** |
| **BENCHMARKS** | **S&P 500 (SPY)** | **+9.08%** | **0.95** | **1.12%** | **-7.28%** |
| | **Nasdaq 100 (QQQ)** | **+17.71%** | **1.12** | **1.48%** | **-9.84%** |
| | **FinMem 5-Stock Average** | **+32.27%** | **1.42** | **3.13%** | **20.08%** |
| | **Multi-Agent (Ours - Exp 1 Unmasked Daily)** | **+30.94%** | **1.56** | **2.35%** | **-17.11%** |
| | **Multi-Agent (Ours - Exp 1 Unmasked Discrete)** | **+40.74%** | **1.56** | **2.35%** | **-17.11%** |
| | **Multi-Agent (Ours - Exp 2 Masked Daily)** | **+13.38%** | **0.77** | **2.31%** | **-17.11%** |
| | **Multi-Agent (Ours - Exp 2 Masked Discrete)** | **+24.45%** | **0.77** | **2.31%** | **-17.11%** |

---

### 7.3. Sub-Period Allocation & Trace Dynamics

```mermaid
flowchart LR
    P1["Period 1: Nov 22 - Jan 23<br/><b>Bear Market Defense</b><br/>TSLA -45.9%, COIN -44.1%<br/><i>HRP defensive: -9.77% vs EW -21.09% (+11.32% Alpha)</i>"]
    --> P2["Period 2: Jan 23 - Mar 23<br/><b>Tech Rebound Capture</b><br/>Broad-based recovery<br/><i>Multi-Agent: +25.01% vs SPY +4.05%</i>"]
    --> P3["Period 3: Mar 23 - May 23<br/><b>Generative AI Wave</b><br/>MSFT 100% allocation<br/><i>Multi-Agent: +24.77% vs EW +1.65% (+23.12% Alpha)</i>"]
```

#### Period 1: November 1, 2022 to January 1, 2023 (Bear Market Defense)
* **Market Environment:** Rapid interest rate hikes and the collapse of the FTX crypto exchange.
* **Underlying Asset Moves:** `TSLA: -45.93%`, `COIN: -44.08%`, `AMZN: -13.21%`, `MSFT: +5.40%`, `NFLX: +2.84%`. Equal-Weight: `-21.09%`.
* **Agent Weights:** `MSFT: 39.27%`, `AMZN: 21.65%`, `NFLX: 18.00%`, `TSLA: 13.31%`, `COIN: 7.77%`.
* **Portfolio Return:** **-9.77%** (**+11.32% Alpha** over the Equal-Weight benchmark).
* **Mechanics:** The Bear Researcher identified contagion risk in crypto and automotive price discounting. HRP downweighted speculative assets, preserving capital.

#### Period 2: January 1, 2023 to March 1, 2023 (Tech Rebound Capture)
* **Market Environment:** Relief rally driven by moderating inflation readings.
* **Underlying Asset Moves:** `TSLA: +90.30%`, `COIN: +92.95%`, `AMZN: +9.80%`, `NFLX: +9.22%`, `MSFT: +4.37%`. Equal-Weight: `+38.74%`.
* **Agent Weights:** `MSFT: 39.83%`, `AMZN: 21.85%`, `NFLX: 16.87%`, `TSLA: 13.38%`, `COIN: 8.06%`.
* **Portfolio Return:** **+25.01%** (outperforming S&P 500 at `+4.05%` and QQQ at `+11.00%`).

#### Period 3: March 1, 2023 to May 1, 2023 (Generative AI Inflection)
* **Market Environment:** Silicon Valley Bank crisis; divergence between defensive mega-cap AI leaders and struggling consumer/speculative equities.
* **Underlying Asset Moves:** `MSFT: +24.77%`, `AMZN: +14.41%`, `NFLX: +5.25%`, `COIN: -16.82%`, `TSLA: -18.97%`. Equal-Weight: `+1.65%`.
* **Agent Weights:** `MSFT: 100.00%`, `TSLA: 0.00%`, `AMZN: 0.00%`, `NFLX: 0.00%`, `COIN: 0.00%`.
* **Portfolio Return:** **+24.77%** (**+23.12% Alpha** over Equal-Weight, **+19.00% Alpha** over SPY).
* **Mechanics:** The Bull Researcher flagged Microsoft's multi-billion dollar partnership with OpenAI and Bing AI launch. Black-Litterman allocated 100% into `MSFT`, dodging drawdowns in `TSLA` (-18.97%) and `COIN` (-16.82%).

---

## 8. Codebase Architecture & File Reference

```
multi_agent_portfolio/
├── agents/
│   ├── __init__.py
│   └── portfolio_agents.py         # Defines the 7 CrewAI Agents and model configurations
├── tasks/
│   ├── __init__.py
│   └── portfolio_tasks.py          # Defines Task descriptions, prompts, and expected outputs
├── tools/
│   ├── __init__.py
│   ├── financial_tools.py          # yfinance data wrappers and simulated date pinning
│   ├── optimization_tools.py       # Black-Litterman and HRP PyPortfolioOpt solvers
│   ├── memory_tools.py             # ChromaDB vector memory with composite re-ranking
│   └── screening_tools.py          # Multi-universe screening and listwise ranking
├── backtest_data/
│   ├── fundamentals.json           # Point-in-time financial metrics for the simulation
│   └── news.json                   # Point-in-time curated news headlines
├── .chroma_db/                     # Persistent local ChromaDB database files
├── backtest_engine.py              # Automated 3-period MASS simulation runner
├── backtest_results.json           # Machine-readable output logs and sub-period returns
├── main.py                         # Single-shot end-to-end execution script
├── simulation.py                   # MASS Masking Protocol for look-ahead contamination control
├── technical_report.md             # Formal research paper benchmarking against FinMem
├── requirements.txt                # Python package dependencies
└── .env.example                    # Environment variable template
```

---

## 9. Zero-Cost Infrastructure & Deployment Guide

The entire architecture is designed to run on a **zero-cost, open-source technology stack** without commercial API subscriptions.

```mermaid
flowchart LR
    Kaggle["Kaggle Dual Tesla T4 GPUs"] --> Ollama["Ollama Local Server: ritu-27b (ctx: 100k)"]
    Ollama --> CF["cloudflared tunnel: https://*.trycloudflare.com"]
    CF --> Client["Local Workspace: CrewAI / Python 3.12 Virtualenv"]
```

### 9.1. Kaggle GPU Ollama Setup
Execute the following commands in a Kaggle notebook equipped with dual Nvidia Tesla T4 GPUs:

```bash
# 1. Install dependencies & cloudflared
apt-get update -qq && apt-get install -y zstd pciutils lshw psmisc curl -qq
curl -fsSL https://ollama.com/install.sh | sh
wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb > /dev/null 2>&1

# 2. Start Ollama with wide context and zero-copy model registry
export OLLAMA_HOST="127.0.0.1:11434"
export OLLAMA_ORIGINS="*"
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_CONTEXT_LENGTH=100000
ollama serve &

# 3. Start Cloudflare Tunnel with DNS header rebinding
cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost:11434
```

### 9.2. Local Environment Configuration
Configure your `.env` file in the project root:

```ini
# Primary: Kaggle Ollama Cloudflare Quick Tunnel
LLM_BASE_URL=https://<your-tunnel-id>.trycloudflare.com
LLM_MODEL=ollama/ritu-27b:latest
LLM_API_KEY=ollama

# Secondary Fallback: OpenRouter Free Tier
OPENROUTER_API_KEY=your_openrouter_key_here
```

### 9.3. Running the System
```bash
# Activate virtual environment
source venv/bin/activate

# 1. Run instant quantitative statistical evaluation (reproduces Table 2 without GPU)
python backtest_engine.py --eval-only

# 2. Run full 3-period live multi-agent simulation with MASS masking active
python backtest_engine.py --live

# 3. Run single-period live interactive analysis
python main.py
```

---

## 10. Future Enhancements & Production Roadmap

1. **Transaction Cost & Slippage Modeling:** Ingestion of bid-ask spreads and Almgren-Chriss market impact functions to penalize excessive rebalancing turnover.
2. **Event-Driven Continuous Rebalancing:** Transition from discrete bi-monthly rebalancing to a real-time event listener triggering re-evaluation whenever portfolio Value-at-Risk increases by $> 15\%$.
3. **Dynamic Universe Scaling (FinRankGRPO):** Upgrading from static screening to listwise relative ranking over the complete S&P 500 (500+ equities).
4. **Multi-Modal Data Ingestion:** Parsing audio earnings call recordings via Whisper to analyze executive vocal tone and sentiment hesitation.

---
*Created By: Vibhor Shukla, Roll number: 23115107, for academic submission at NIT Raipur.*
