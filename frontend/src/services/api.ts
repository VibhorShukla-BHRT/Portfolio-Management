import { CuratedUniverses, OptimizationResult, PaperPortfolio, PaperPortfolioDetail } from '../types/portfolio';

const API_BASE = '/api';

export async function fetchUniverses(): Promise<CuratedUniverses> {
  const res = await fetch(`${API_BASE}/market/universes`);
  if (!res.ok) throw new Error('Failed to load stock universes');
  return res.json();
}

export async function fetchQuotes(tickers: string[]) {
  const res = await fetch(`${API_BASE}/market/quote?tickers=${encodeURIComponent(tickers.join(','))}`);
  if (!res.ok) throw new Error('Failed to fetch market quotes');
  return res.json();
}

export async function streamOptimizationAnalysis(
  payload: {
    tickers: string[];
    capital: number;
    strategy_mode: string;
    enable_masking: boolean;
    custom_api_key?: string;
  },
  onEvent: (event: string, data: any) => void,
  onError: (err: any) => void,
  onFinish: () => void
) {
  try {
    const response = await fetch(`${API_BASE}/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventMatch = block.match(/^event:\s*(.+)$/m);
        const dataMatch = block.match(/^data:\s*(.+)$/m);

        const event = eventMatch ? eventMatch[1].trim() : 'message';
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1].trim());
            onEvent(event, data);
          } catch (e) {
            console.error('Failed to parse SSE JSON block:', block, e);
          }
        }
      }
    }
    onFinish();
  } catch (error) {
    onError(error);
  }
}

export async function createDummyPortfolio(payload: {
  name: string;
  market: string;
  currency: string;
  initial_capital: number;
  holdings: any[];
  strategy_mode: string;
  investment_date?: string;
}): Promise<PaperPortfolioDetail> {
  const res = await fetch(`${API_BASE}/dummy-invest/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create paper investment portfolio');
  return res.json();
}

export async function listDummyPortfolios(): Promise<PaperPortfolio[]> {
  const res = await fetch(`${API_BASE}/dummy-invest/list`);
  if (!res.ok) throw new Error('Failed to fetch paper portfolios');
  return res.json();
}

export async function getDummyPortfolioDetail(
  portfolioId: string,
  timeframe: string = 'ALL'
): Promise<PaperPortfolioDetail> {
  const res = await fetch(`${API_BASE}/dummy-invest/${portfolioId}?timeframe=${encodeURIComponent(timeframe)}`);
  if (!res.ok) throw new Error('Failed to load portfolio tracking data');
  return res.json();
}

export async function updateDummyPortfolioDate(portfolioId: string, investmentDate: string): Promise<void> {
  const res = await fetch(`${API_BASE}/dummy-invest/${portfolioId}/date`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ investment_date: investmentDate }),
  });
  if (!res.ok) throw new Error('Failed to update investment date');
}

export async function deleteDummyPortfolio(portfolioId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/dummy-invest/${portfolioId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete portfolio');
}
