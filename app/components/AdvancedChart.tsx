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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-auto mac-window">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold mac-text">Advanced Chart: {symbol}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
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
                  "px-3 py-1 border-2 border-black rounded",
                  timeRange === range
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-100"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-black border-r-black border-b-black border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-red-500">
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No data available for this time range
            </div>
          ) : (
            <div className="h-[400px] border-2 border-black rounded p-4">
              {/* 这里可以添加更详细的图表实现 */}
              <div className="space-y-2">
                {chartData.map((point, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{point.date}</span>
                    <span>${point.price.toFixed(2)}</span>
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