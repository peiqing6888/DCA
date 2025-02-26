export interface Asset {
  symbol: string;
  name: string;
  current_price: number;
  change_24h: number;
  volume_24h: number;
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