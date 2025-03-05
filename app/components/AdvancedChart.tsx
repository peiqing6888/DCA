'use client'

import { useState, useEffect } from 'react';
import { ChartData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AdvancedChartProps {
  symbol: string;
  onClose: () => void;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export default function AdvancedChart({ symbol, onClose }: AdvancedChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/assets/${symbol}/chart?range=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, timeRange]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="nerv-window p-6 w-[800px] max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold nerv-text">Advanced Chart: {symbol}</h2>
          <button
            onClick={onClose}
            className="nerv-button p-2 hover:bg-opacity-20"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end space-x-2">
            {(['1D', '1W', '1M', '3M', '1Y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "nerv-button px-3 py-1 rounded",
                  timeRange === range
                    ? "bg-[#00ff00] text-black"
                    : ""
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-[#00ff00] border-r-[#00ff00] border-b-[#00ff00] border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center nerv-text-warning">
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center nerv-text">
              No data available for this time range
            </div>
          ) : (
            <div className="h-[400px] nerv-window p-4">
              <div className="space-y-2">
                {chartData.map((point, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="nerv-text">{point.date}</span>
                    <span className="nerv-text-secondary">${point.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 