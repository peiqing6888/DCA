'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  price: number;
  sma50: number;
  sma200: number;
}

interface AssetChartProps {
  symbol: string;
  timeRange: '1D' | '1W' | '1M' | '3M' | '1Y';
  onError: (error: string) => void;
}

export default function AssetChart({ symbol, timeRange, onError }: AssetChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        onError('');
        const response = await fetch(`http://localhost:8000/assets/${symbol}/chart?range=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        onError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, timeRange, onError]);

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          Please select an asset to view chart
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-2">Loading chart...</div>
          <div className="w-8 h-8 border-4 border-t-[#666666] border-r-[#666666] border-b-[#666666] border-l-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          No data available for this time range
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#D8D8D8',
              border: '2px solid black',
              borderRadius: '4px',
              padding: '8px',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#000000"
            dot={false}
            name="Price"
          />
          <Line
            type="monotone"
            dataKey="sma50"
            stroke="#2563eb"
            dot={false}
            name="50 SMA"
          />
          <Line
            type="monotone"
            dataKey="sma200"
            stroke="#dc2626"
            dot={false}
            name="200 SMA"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 