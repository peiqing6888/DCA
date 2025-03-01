export interface Asset {
  symbol: string;
  name: string;
  current_price: number;
  change_24h: number;
  volume_24h: number;
}

export interface ChartData {
  date: string;
  price: number;
  sma50: number;
  sma200: number;
}

export interface DCAStrategy {
  asset: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: Date;
  end_date?: Date;
  ai_enhanced: boolean;
}

export interface DCARecommendation {
  asset: string;
  optimal_entry_price: number;
  sentiment: string;
  confidence: number;
  next_dca_date: Date;
  suggested_amount: number;
  market_conditions: string[];
}

export interface TokenPrice {
  price: number;
  timestamp: number;
  symbol: string;
  confidence: number;
}

const API_BASE_URL = 'http://localhost:8000';

export async function getAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_BASE_URL}/assets`);
  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }
  return response.json();
}

export async function analyzeDCAStrategy(strategy: DCAStrategy): Promise<DCARecommendation> {
  const response = await fetch(`${API_BASE_URL}/dca/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...strategy,
      start_date: strategy.start_date.toISOString(),
      end_date: strategy.end_date?.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze DCA strategy');
  }

  const data = await response.json();
  return {
    ...data,
    next_dca_date: new Date(data.next_dca_date),
  };
}

export async function getTokenPrice(tokenId: string): Promise<TokenPrice> {
  const response = await fetch(`${API_BASE_URL}/token/price/${tokenId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch token price');
  }

  return await response.json();
}

export async function getChartData(symbol: string, range: string): Promise<ChartData[]> {
  const response = await fetch(`${API_BASE_URL}/assets/${symbol}/chart?range=${range}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch chart data');
  }

  return await response.json();
} 