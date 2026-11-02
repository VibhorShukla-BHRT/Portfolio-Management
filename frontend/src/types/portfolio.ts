export type MarketType = 'US' | 'IN';
export type StrategyMode = 'balanced' | 'conservative' | 'aggressive';

export interface UniversePreset {
  id: string;
  name: string;
  description: string;
  tickers: string[];
  currency: string;
  market: MarketType;
}

export interface CuratedUniverses {
  us: UniversePreset[];
  in: UniversePreset[];
}

export interface HoldingAllocation {
  ticker: string;
  name: string;
  target_weight: number;
  price: number;
  shares: number;
  allocated_cash: number;
  currency: string;
  market: MarketType;
  change_pct: number;
}

export interface PortfolioMetrics {
  expected_annual_return_pct: number;
  annual_volatility_pct: number;
  sharpe_ratio: number;
  max_drawdown_estimate_pct: number;
  var_95_pct: number;
  projected_1yr_capital: number;
}

export interface OptimizationResult {
  status: string;
  method_used: string;
  total_capital: number;
  currency: string;
  total_invested: number;
  cash_reserve: number;
  metrics: PortfolioMetrics;
  weights: {
    mass_optimal: Record<string, number>;
    hrp_benchmark: Record<string, number>;
    equal_weight_benchmark: Record<string, number>;
  };
  holdings: HoldingAllocation[];
}

export interface AgentEvent {
  agent_id: string;
  agent_name: string;
  role?: string;
  status: 'pending' | 'analyzing' | 'complete';
  message?: string;
  output?: string;
  views?: Record<string, number>;
}

export interface PaperHolding {
  ticker: string;
  name: string;
  shares: number;
  buy_price: number;
  live_price: number;
  current_value: number;
  unrealized_pnl: number;
  pnl_pct: number;
  day_change_pct: number;
  currency: string;
}

export interface PaperSnapshot {
  label: string;
  date_iso: string;
  display_market_time?: string;
  time_ist?: string;
  time_edt?: string;
  total_valuation: number;
  return_pct: number;
  benchmark_return_pct?: number;
}

export interface TimezoneInfo {
  market: MarketType;
  exchange_name: string;
  exchange_timezone: string;
  market_hours: string;
  user_timezone: string;
  investment_date?: string;
}

export interface PaperPortfolioSummary {
  initial_capital: number;
  cash_balance: number;
  invested_value: number;
  total_valuation: number;
  total_pnl: number;
  total_return_pct: number;
  day_pnl: number;
  currency: string;
  benchmark: {
    name: string;
    symbol: string;
    day_change_pct: number;
  };
}

export interface PaperPortfolio {
  id: string;
  name: string;
  market: MarketType;
  currency: string;
  initial_capital: number;
  cash_balance: number;
  strategy_mode: StrategyMode;
  investment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaperPortfolioDetail {
  portfolio: PaperPortfolio;
  timeframe?: string;
  timezone_info?: TimezoneInfo;
  summary: PaperPortfolioSummary;
  holdings: PaperHolding[];
  history: PaperSnapshot[];
}
