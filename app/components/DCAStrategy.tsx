'use client';

import { useState, useEffect } from 'react';
import { type Asset, type DCARecommendation, getAssets, analyzeDCAStrategy } from '@/lib/api';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import AdvancedChart from './AdvancedChart';

type Frequency = 'daily' | 'weekly' | 'monthly';

// Market sentiment type
type MarketSentiment = 'Bullish' | 'Bearish' | 'Neutral';

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

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface PerformanceMetric {
  date: Date;
  investment: number;
  value: number;
  roi: number;
}

// AI Confidence Indicator component
const ConfidenceIndicator = ({ value }: { value: number }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mac-border">
    <div 
      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
      style={{ width: `${value * 100}%` }}
    />
  </div>
);

// Retro-style Dashboard component
const RetroGauge = ({ sentiment }: { sentiment: MarketSentiment }) => {
  const getColor = () => {
    switch (sentiment) {
      case 'Bullish': return 'bg-green-500';
      case 'Bearish': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="relative w-20 h-20 rounded-full border-4 border-black flex items-center justify-center">
      <div className={`absolute w-4 h-4 rounded-full ${getColor()} shadow-lg`} />
      <div className="text-xs font-bold">{sentiment}</div>
    </div>
  );
};

// Notification component
const NotificationBadge = ({ notifications }: { notifications: Notification[] }) => (
  <div className="mac-window p-2 max-h-40 overflow-auto">
    {notifications.map(notification => (
      <div 
        key={notification.id}
        className={cn(
          "mb-2 p-2 text-xs rounded mac-border",
          notification.type === 'success' ? 'bg-green-100' :
          notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
        )}
      >
        <div className="font-bold">{notification.message}</div>
        <div className="text-[10px] text-gray-500">
          {notification.timestamp.toLocaleTimeString()}
        </div>
      </div>
    ))}
  </div>
);

// Performance Metrics component
const PerformanceMetrics = ({ metrics }: { metrics: PerformanceMetric[] }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-3 gap-2">
      <div className="mac-window p-2 text-center">
        <div className="text-xs font-bold">Total Investment</div>
        <div className="text-sm">${metrics.reduce((sum, m) => sum + m.investment, 0).toFixed(2)}</div>
      </div>
      <div className="mac-window p-2 text-center">
        <div className="text-xs font-bold">Current Value</div>
        <div className="text-sm">${metrics.reduce((sum, m) => sum + m.value, 0).toFixed(2)}</div>
      </div>
      <div className="mac-window p-2 text-center">
        <div className="text-xs font-bold">Average ROI</div>
        <div className="text-sm">
          {(metrics.reduce((sum, m) => sum + m.roi, 0) / metrics.length).toFixed(2)}%
        </div>
      </div>
    </div>
  </div>
);

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
  
  // Add: AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState({
    marketSentiment: 'Neutral' as MarketSentiment,
    confidence: 0.5,
    lastUpdate: new Date(),
    predictions: [] as string[],
  });

  // Add: Additional states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Simulate AI analysis update
  useEffect(() => {
    if (!selectedAsset || !aiEnhanced) return;

    const updateAiAnalysis = () => {
      const sentiments: MarketSentiment[] = ['Bullish', 'Bearish', 'Neutral'];
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const randomConfidence = 0.5 + (Math.random() * 0.5); // Between 0.5 and 1.0

      setAiAnalysis(prev => ({
        ...prev,
        marketSentiment: randomSentiment,
        confidence: randomConfidence,
        lastUpdate: new Date(),
        predictions: [
          'Market volatility expected to increase in short term',
          'Recommend buying in batches during price corrections',
          'Monitor macroeconomic indicator changes',
        ],
      }));

      // Play retro computer notification sound
      soundManager.play('notification');
    };

    // Update analysis every 30 seconds
    const timer = setInterval(updateAiAnalysis, 30000);
    updateAiAnalysis(); // Initial update

    return () => clearInterval(timer);
  }, [selectedAsset, aiEnhanced]);

  // Simulate generating performance metrics
  useEffect(() => {
    if (!selectedAsset) return;

    const generateMetrics = () => {
      const metrics: PerformanceMetric[] = [];
      let totalInvestment = amount;
      
      for (let i = 0; i < 6; i++) {
        const randomROI = -10 + Math.random() * 30; // -10% to +20%
        const value = totalInvestment * (1 + randomROI / 100);
        
        metrics.push({
          date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          investment: totalInvestment,
          value: value,
          roi: randomROI
        });

        totalInvestment += amount;
      }

      setPerformanceMetrics(metrics.reverse());
    };

    generateMetrics();
  }, [selectedAsset, amount]);

  // Simulate generating intelligent notifications
  useEffect(() => {
    if (!selectedAsset || !aiEnhanced) return;

    const generateNotification = () => {
      const notificationTypes = [
        {
          type: 'success',
          messages: [
            'Best buying time: Current price below 30-day moving average',
            'AI prediction: Market about to bottom out and rebound',
            'Recommend: Increase regular investment amount to seize the opportunity'
          ]
        },
        {
          type: 'warning',
          messages: [
            'Attention: Market volatility increasing',
            'Recommend: Consider diversifying investments to reduce risk',
            'Reminder: Next regular investment date approaching'
          ]
        },
        {
          type: 'info',
          messages: [
            'Market analysis: Main indicators trend positive',
            'Strategy reminder: Maintain current investment plan',
            'AI insight: Institutional funds inflow increasing'
          ]
        }
      ];

      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const randomMessage = randomType.messages[Math.floor(Math.random() * randomType.messages.length)];

      const newNotification: Notification = {
        id: Date.now().toString(),
        type: randomType.type as 'success' | 'warning' | 'info',
        message: randomMessage,
        timestamp: new Date()
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      soundManager.play('notification');
    };

    const timer = setInterval(generateNotification, 45000);
    generateNotification(); // Initial notification

    return () => clearInterval(timer);
  }, [selectedAsset, aiEnhanced]);

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

      // Save strategy
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

          {/* Price chart button */}
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

      {/* AI Analysis Dashboard */}
      {aiEnhanced && (
        <div className="mac-window p-4 rounded">
          <div className="mb-4">
            <h2 className="text-lg font-bold mac-text">AI Market Analysis</h2>
            <p className="text-xs text-gray-500">
              Last updated: {aiAnalysis.lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <RetroGauge sentiment={aiAnalysis.marketSentiment} />
                <div>
                  <div className="text-sm font-bold">Market Sentiment</div>
                  <div className="text-xs">{aiAnalysis.marketSentiment}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold mb-2">AI Confidence</div>
                <ConfidenceIndicator value={aiAnalysis.confidence} />
              </div>
            </div>

            <div className="border-l border-black pl-4">
              <div className="text-sm font-bold mb-2">AI Predictions</div>
              <ul className="text-xs space-y-2">
                {aiAnalysis.predictions.map((prediction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{prediction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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

      {/* Intelligent Notification Button */}
      {aiEnhanced && notifications.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative mac-button p-2"
          >
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
              {notifications.length}
            </span>
            📬
          </button>
          
          {showNotifications && (
            <div className="absolute bottom-12 right-0 w-64">
              <NotificationBadge notifications={notifications} />
            </div>
          )}
        </div>
      )}

      {/* Performance Analysis Panel */}
      {performanceMetrics.length > 0 && (
        <div className="mac-window p-4 rounded">
          <h2 className="text-lg font-bold mac-text mb-4">Strategy Performance</h2>
          <PerformanceMetrics metrics={performanceMetrics} />
        </div>
      )}
    </div>
  );
} 