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

// Add new type for market analysis
interface MarketAnalysis {
  sentiment: MarketSentiment;
  confidence: number;
  factors: string[];
  prediction: string;
  timestamp: string;
}

// AI Confidence Indicator component
const ConfidenceIndicator = ({ value }: { value: number }) => (
  <div className="relative w-full h-4 nerv-window overflow-hidden">
    <div 
      className="h-full bg-[#00ff00] transition-all duration-500 relative"
      style={{ width: `${value * 100}%` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(0,255,0,0.2)] to-transparent animate-pulse"></div>
    </div>
    <div className="absolute top-0 left-0 w-full h-full" style={{
      background: 'repeating-linear-gradient(90deg, rgba(0,255,0,0.1) 0px, rgba(0,255,0,0.1) 4px, transparent 4px, transparent 8px)'
    }}></div>
  </div>
);

// Retro-style Dashboard component
const RetroGauge = ({ sentiment }: { sentiment: MarketSentiment }) => {
  const getColor = () => {
    switch (sentiment) {
      case 'Bullish': return '#00ff00';
      case 'Bearish': return '#ff0000';
      default: return '#ff6600';
    }
  };

  const color = getColor();

  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 nerv-window rounded-full flex items-center justify-center">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="283"
              strokeDashoffset={283 * (1 - (sentiment === 'Bullish' ? 1 : sentiment === 'Bearish' ? 0 : 0.5))}
              className="transition-all duration-1000"
            />
          </svg>
          <div 
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color, textShadow: `0 0 5px ${color}` }}
          >
            {sentiment}
          </div>
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3" style={{
        background: color,
        boxShadow: `0 0 10px ${color}`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
      }}></div>
    </div>
  );
};

// Notification component
const NotificationBadge = ({ notifications }: { notifications: Notification[] }) => (
  <div className="nerv-window p-2 max-h-40 overflow-auto">
    {notifications.map(notification => (
      <div 
        key={notification.id}
        className={cn(
          "mb-2 p-2 text-xs rounded nerv-window",
          notification.type === 'success' ? 'nerv-text' :
          notification.type === 'warning' ? 'nerv-text-warning' : 'nerv-text-secondary'
        )}
      >
        <div className="font-bold">{notification.message}</div>
        <div className="text-[10px] opacity-70">
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
      <div className="nerv-window p-2 text-center">
        <div className="text-xs font-bold nerv-text">Total Investment</div>
        <div className="text-sm nerv-text-secondary">${metrics.reduce((sum, m) => sum + m.investment, 0).toFixed(2)}</div>
      </div>
      <div className="nerv-window p-2 text-center">
        <div className="text-xs font-bold nerv-text">Current Value</div>
        <div className="text-sm nerv-text-secondary">${metrics.reduce((sum, m) => sum + m.value, 0).toFixed(2)}</div>
      </div>
      <div className="nerv-window p-2 text-center">
        <div className="text-xs font-bold nerv-text">Average ROI</div>
        <div className={cn(
          "text-sm",
          metrics.reduce((sum, m) => sum + m.roi, 0) / metrics.length > 0 ? 'nerv-text' : 'nerv-text-warning'
        )}>
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
  
  // Update AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<MarketAnalysis>({
    sentiment: 'Neutral',
    confidence: 0.5,
    factors: [],
    prediction: '',
    timestamp: new Date().toISOString()
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

  // Add function to fetch market analysis
  const fetchMarketAnalysis = async (asset: string) => {
    try {
      const response = await fetch(`http://localhost:8000/market-analysis/${asset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market analysis');
      }
      const data = await response.json();
      setAiAnalysis(data);
      soundManager.play('notification');
    } catch (error) {
      console.error('Failed to fetch market analysis:', error);
    }
  };

  // Update AI analysis effect
  useEffect(() => {
    if (!selectedAsset || !aiEnhanced) return;

    // Initial fetch
    fetchMarketAnalysis(selectedAsset);

    // Update analysis every 5 minutes
    const timer = setInterval(() => {
      fetchMarketAnalysis(selectedAsset);
    }, 5 * 60 * 1000);

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
        <div className="nerv-window p-4 rounded">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="mb-2 nerv-text">Loading assets...</div>
              <div className="w-8 h-8 border-4 border-t-[#00ff00] border-r-[#00ff00] border-b-[#00ff00] border-l-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="nerv-window p-4 rounded relative">
        <div className="mb-4">
          <h2 className="text-lg font-bold nerv-text">DCA Strategy Analysis</h2>
        </div>
        {error && (
          <div className="mb-4 p-3 nerv-window nerv-text-warning">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold nerv-text">Asset</label>
            <div className="relative">
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                }}
                className="w-full px-3 py-2 nerv-input rounded appearance-none pr-8"
                disabled={loading}
              >
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - ${asset.current_price.toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none nerv-text">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {selectedAsset && assets.length > 0 && (
              <div className="text-sm">
                <span className={cn(
                  "font-medium",
                  assets.find(a => a.symbol === selectedAsset)?.change_24h || 0 > 0 
                    ? "nerv-text" 
                    : "nerv-text-warning"
                )}>
                  24h Change: {assets.find(a => a.symbol === selectedAsset)?.change_24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="py-2">
            <button
              onClick={() => setShowAdvancedChart(true)}
              className="w-full nerv-button rounded flex items-center justify-center gap-2"
              disabled={!selectedAsset || loading}
            >
              <span>📈</span> View Price Chart
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold nerv-text">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full nerv-input rounded"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold nerv-text">Frequency</label>
            <div className="relative">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-3 py-2 nerv-input rounded appearance-none pr-8"
                disabled={loading}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none nerv-text">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiEnhanced}
              onChange={(e) => setAiEnhanced(e.target.checked)}
              className="w-4 h-4 nerv-input rounded"
              disabled={loading}
            />
            <label className="text-sm font-bold nerv-text">AI Enhanced Strategy</label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedAsset}
            className={cn(
              "w-full nerv-button rounded relative",
              loading || !selectedAsset ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-t-[#00ff00] border-r-[#00ff00] border-b-[#00ff00] border-l-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <span className={loading ? "opacity-0" : ""}>
              {loading ? 'Analyzing...' : 'Analyze Strategy'}
            </span>
          </button>
        </div>
        
        {/* Hexagon decoration */}
        <div className="absolute -top-1 -right-1 w-3 h-3 nerv-hexagon"></div>
      </div>

      {/* AI Analysis Dashboard */}
      {aiEnhanced && (
        <div className="nerv-window p-4 rounded relative">
          <div className="mb-4">
            <h2 className="text-lg font-bold nerv-text">AI Market Analysis</h2>
            <p className="text-xs nerv-text-secondary">
              Last updated: {new Date(aiAnalysis.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <RetroGauge sentiment={aiAnalysis.sentiment} />
                <div>
                  <div className="text-sm font-bold nerv-text">Market Sentiment</div>
                  <div className="text-xs nerv-text-secondary">{aiAnalysis.sentiment}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold mb-2 nerv-text">AI Confidence</div>
                <ConfidenceIndicator value={aiAnalysis.confidence} />
              </div>
            </div>

            <div className="border-l border-[#00ff00]/20 pl-4">
              <div className="text-sm font-bold mb-2 nerv-text">Key Factors</div>
              <ul className="text-xs space-y-2">
                {aiAnalysis.factors.map((factor, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 nerv-text">•</span>
                    <span className="nerv-text-secondary">{factor}</span>
                  </li>
                ))}
              </ul>
              
              {aiAnalysis.prediction && (
                <div className="mt-4">
                  <div className="text-sm font-bold mb-2 nerv-text">AI Prediction</div>
                  <p className="text-xs nerv-text-secondary">{aiAnalysis.prediction}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Hexagon decoration */}
          <div className="absolute -top-1 -right-1 w-3 h-3 nerv-hexagon"></div>
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
        <div className="nerv-window p-4 rounded relative">
          <div className="mb-4">
            <h2 className="text-lg font-bold nerv-text">Strategy Recommendation</h2>
          </div>
          <div className="space-y-2">
            <p className="nerv-text">
              <strong>Optimal Entry Price:</strong> ${recommendation.optimal_entry_price.toFixed(2)}
            </p>
            <p className="nerv-text">
              <strong>Market Sentiment:</strong> {recommendation.sentiment}
            </p>
            <p className="nerv-text">
              <strong>Confidence:</strong> {(recommendation.confidence * 100).toFixed(1)}%
            </p>
            <p className="nerv-text">
              <strong>Next DCA Date:</strong> {recommendation.next_dca_date.toLocaleDateString()}
            </p>
            <p className="nerv-text">
              <strong>Suggested Amount:</strong> ${recommendation.suggested_amount.toFixed(2)}
            </p>
            <div className="nerv-text">
              <strong>Market Conditions:</strong>
              <ul className="list-none pl-5 mt-1 space-y-1">
                {recommendation.market_conditions.map((condition, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 nerv-hexagon"></div>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Hexagon decoration */}
          <div className="absolute -top-1 -right-1 w-3 h-3 nerv-hexagon"></div>
        </div>
      )}

      {/* Strategy History */}
      {savedStrategies.length > 0 && (
        <div className="nerv-window p-4 rounded relative">
          <div className="mb-4">
            <h2 className="text-lg font-bold nerv-text">Strategy History</h2>
          </div>
          <div className="space-y-4">
            {savedStrategies.map((saved) => (
              <div
                key={saved.id}
                className="nerv-window p-3 rounded relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold nerv-text">{saved.strategy.asset}</p>
                    <p className="text-sm nerv-text-secondary">
                      {new Date(saved.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="nerv-text">${saved.strategy.amount}</p>
                    <p className="text-sm nerv-text capitalize">{saved.strategy.frequency}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[#00ff00]/20">
                  <p className="text-sm nerv-text">
                    <strong>Sentiment:</strong> {saved.recommendation.sentiment}
                  </p>
                  <p className="text-sm nerv-text">
                    <strong>Entry Price:</strong> ${saved.recommendation.optimal_entry_price.toFixed(2)}
                  </p>
                </div>
                
                {/* Hexagon decoration */}
                <div className="absolute -top-1 -right-1 w-2 h-2 nerv-hexagon"></div>
              </div>
            ))}
          </div>
          
          {/* Hexagon decoration */}
          <div className="absolute -top-1 -right-1 w-3 h-3 nerv-hexagon"></div>
        </div>
      )}

      {/* Performance Analysis Panel */}
      {performanceMetrics.length > 0 && (
        <div className="nerv-window p-4 rounded relative">
          <h2 className="text-lg font-bold nerv-text mb-4">Strategy Performance</h2>
          <PerformanceMetrics metrics={performanceMetrics} />
          
          {/* Hexagon decoration */}
          <div className="absolute -top-1 -right-1 w-3 h-3 nerv-hexagon"></div>
        </div>
      )}

      {/* Intelligent Notification Button */}
      {aiEnhanced && notifications.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative nerv-button p-2"
          >
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff0000] text-black text-[10px] flex items-center justify-center nerv-hexagon">
              {notifications.length}
            </span>
            <span className="nerv-text">📬</span>
          </button>
          
          {showNotifications && (
            <div className="absolute bottom-12 right-0 w-64">
              <NotificationBadge notifications={notifications} />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 