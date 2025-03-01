'use client';

import { useState, useEffect } from 'react';
import { type Asset, type DCARecommendation, getAssets, analyzeDCAStrategy } from '@/lib/api';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import AdvancedChart from './AdvancedChart';

type Frequency = 'daily' | 'weekly' | 'monthly';
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

interface Strategy {
  asset: string;
  amount: number;
  frequency: Frequency;
  start_date: Date;
  ai_enhanced: boolean;
}

interface SavedStrategy {
  id: string;
  created_at: string;
  strategy: Strategy;
  recommendation: DCARecommendation;
}

export default function DCAStrategy() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [aiEnhanced, setAiEnhanced] = useState(true);
  const [recommendation, setRecommendation] = useState<DCARecommendation | null>(null);
  const [showAdvancedChart, setShowAdvancedChart] = useState(false);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const data = await getAssets();
        setAssets(data);
        if (data.length > 0) {
          setSelectedAsset(data[0].symbol);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        setError('Failed to fetch assets. Please try again later.');
        soundManager.play('error');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAssets();
  }, []);

  useEffect(() => {
    const fetchSavedStrategies = async () => {
      try {
        const response = await fetch('http://localhost:8000/strategies');
        if (!response.ok) {
          throw new Error('Failed to fetch saved strategies');
        }
        const data = await response.json();
        setSavedStrategies(data);
      } catch (error) {
        console.error('Failed to fetch saved strategies:', error);
      }
    };

    fetchSavedStrategies();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
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

      // 保存策略
      try {
        const response = await fetch('http://localhost:8000/strategies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(strategy),
        });

        if (!response.ok) {
          throw new Error('Failed to save strategy');
        }

        const savedStrategy = await response.json();
        setSavedStrategies(prev => [...prev, savedStrategy]);
      } catch (error) {
        console.error('Failed to save strategy:', error);
      }
    } catch (error) {
      console.error('Failed to analyze strategy:', error);
      setError('Failed to analyze strategy. Please try again later.');
      soundManager.play('error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="mac-window p-4 rounded">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="mb-2">Loading assets...</div>
              <div className="w-8 h-8 border-4 border-t-[#666666] border-r-[#666666] border-b-[#666666] border-l-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="mac-window p-4 rounded">
        <div className="mb-4">
          <h2 className="text-lg font-bold mac-text">DCA Strategy Analysis</h2>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Asset</label>
            <div className="relative">
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded cursor-pointer appearance-none"
                disabled={loading}
              >
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - ${asset.current_price.toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {selectedAsset && assets.length > 0 && (
              <div className="text-sm">
                <span className={cn(
                  "font-medium",
                  assets.find(a => a.symbol === selectedAsset)?.change_24h || 0 > 0 
                    ? "text-green-600" 
                    : "text-red-600"
                )}>
                  24h Change: {assets.find(a => a.symbol === selectedAsset)?.change_24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* 价格图表按钮 */}
          <div className="py-2">
            <button
              onClick={() => setShowAdvancedChart(true)}
              className="w-full px-4 py-2 bg-[#666666] hover:bg-[#777777] text-white font-bold rounded border-2 border-black flex items-center justify-center gap-2"
              disabled={!selectedAsset || loading}
            >
              <span>📈</span> View Price Chart
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-white border-2 border-black rounded"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold mac-text">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full px-3 py-2 bg-white border-2 border-black rounded"
              disabled={loading}
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
              disabled={loading}
            />
            <label className="text-sm font-bold mac-text">AI Enhanced Strategy</label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedAsset}
            className={cn(
              "w-full px-4 py-2 text-white font-bold rounded border-2 border-black relative",
              loading || !selectedAsset ? "bg-gray-500" : "bg-[#666666] hover:bg-[#777777]"
            )}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-t-white border-r-white border-b-white border-l-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <span className={loading ? "opacity-0" : ""}>
              {loading ? 'Analyzing...' : 'Analyze Strategy'}
            </span>
          </button>
        </div>
      </div>

      {/* Advanced Chart Modal */}
      {showAdvancedChart && (
        <AdvancedChart
          symbol={selectedAsset}
          onClose={() => setShowAdvancedChart(false)}
        />
      )}

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

      {savedStrategies.length > 0 && (
        <div className="mac-window p-4 rounded">
          <div className="mb-4">
            <h2 className="text-lg font-bold mac-text">Strategy History</h2>
          </div>
          <div className="space-y-4">
            {savedStrategies.map((saved) => (
              <div
                key={saved.id}
                className="p-3 border-2 border-black rounded bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{saved.strategy.asset}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(saved.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>${saved.strategy.amount}</p>
                    <p className="text-sm capitalize">{saved.strategy.frequency}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/20">
                  <p className="text-sm">
                    <strong>Sentiment:</strong> {saved.recommendation.sentiment}
                  </p>
                  <p className="text-sm">
                    <strong>Entry Price:</strong> ${saved.recommendation.optimal_entry_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 