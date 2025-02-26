'use client';

import { useState, useEffect } from 'react';
import { type Asset, type DCARecommendation, getAssets, analyzeDCAStrategy } from '@/lib/api';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';

type Frequency = 'daily' | 'weekly' | 'monthly';

interface Strategy {
  asset: string;
  amount: number;
  frequency: Frequency;
  start_date: Date;
  ai_enhanced: boolean;
}

export default function DCAStrategy() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [aiEnhanced, setAiEnhanced] = useState(true);
  const [recommendation, setRecommendation] = useState<DCARecommendation | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await getAssets();
        setAssets(data);
        if (data.length > 0) {
          setSelectedAsset(data[0].symbol);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        soundManager.play('error');
      }
    };

    fetchAssets();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    soundManager.play('click');

    try {
      const strategy: Strategy = {
        asset: selectedAsset,
        amount,
        frequency,
        start_date: new Date(),
        ai_enhanced: aiEnhanced,
      };

      const result = await analyzeDCAStrategy(strategy);
      setRecommendation(result);
      soundManager.play('open');
    } catch (error) {
      console.error('Failed to analyze strategy:', error);
      soundManager.play('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="mac-window p-4 rounded">
        <div className="mb-4">
          <h2 className="text-lg font-bold mac-text">DCA Strategy Analysis</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-black rounded"
            >
              {assets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-white border-2 border-black rounded"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full px-3 py-2 bg-white border-2 border-black rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiEnhanced}
              onChange={(e) => setAiEnhanced(e.target.checked)}
              className="w-4 h-4 border-2 border-black rounded"
            />
            <label className="text-sm font-bold mac-text">AI Enhanced Strategy</label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={cn(
              "w-full px-4 py-2 text-white font-bold rounded border-2 border-black",
              loading ? "bg-gray-500" : "bg-[#666666] hover:bg-[#777777]"
            )}
          >
            {loading ? 'Analyzing...' : 'Analyze Strategy'}
          </button>
        </div>
      </div>

      {recommendation && (
        <div className="mac-window p-4 rounded">
          <div className="mb-4">
            <h2 className="text-lg font-bold mac-text">Strategy Recommendation</h2>
          </div>
          <div className="space-y-2">
            <p><strong>Optimal Entry Price:</strong> ${recommendation.optimal_entry_price.toFixed(2)}</p>
            <p><strong>Market Sentiment:</strong> {recommendation.sentiment}</p>
            <p><strong>Confidence:</strong> {(recommendation.confidence * 100).toFixed(1)}%</p>
            <p><strong>Next DCA Date:</strong> {recommendation.next_dca_date.toLocaleDateString()}</p>
            <p><strong>Suggested Amount:</strong> ${recommendation.suggested_amount.toFixed(2)}</p>
            <div>
              <strong>Market Conditions:</strong>
              <ul className="list-disc pl-5 mt-1">
                {recommendation.market_conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 