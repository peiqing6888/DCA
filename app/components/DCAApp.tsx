'use client'

import { useState } from 'react'

interface DCASettings {
  asset: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  aiEnabled: boolean
}

export default function DCAApp() {
  const [settings, setSettings] = useState<DCASettings>({
    asset: 'BTC',
    amount: 100,
    frequency: 'monthly',
    aiEnabled: true
  })

  const assets = ['BTC', 'ETH', 'SOL', 'BNB']
  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ]

  return (
    <div className="space-y-6 font-chicago">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Asset:</label>
          <select 
            value={settings.asset}
            onChange={(e) => setSettings(prev => ({ ...prev, asset: e.target.value }))}
            className="px-2 py-1 border border-black rounded bg-white"
          >
            {assets.map(asset => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Amount (USD):</label>
          <input 
            type="number"
            value={settings.amount}
            onChange={(e) => setSettings(prev => ({ ...prev, amount: Number(e.target.value) }))}
            className="px-2 py-1 border border-black rounded w-24 bg-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Frequency:</label>
          <select 
            value={settings.frequency}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              frequency: e.target.value as DCASettings['frequency']
            }))}
            className="px-2 py-1 border border-black rounded bg-white"
          >
            {frequencies.map(freq => (
              <option key={freq.value} value={freq.value}>{freq.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">AI Enhanced:</label>
          <input 
            type="checkbox"
            checked={settings.aiEnabled}
            onChange={(e) => setSettings(prev => ({ ...prev, aiEnabled: e.target.checked }))}
            className="w-4 h-4 border border-black rounded"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-black/20">
        <div className="bg-[#EFEFEF] p-4 rounded border border-black/20">
          <h3 className="text-sm font-bold mb-2">AI Strategy Insights:</h3>
          <p className="text-xs">
            Based on current market conditions and historical data, the AI suggests:
            {settings.aiEnabled ? (
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Optimal buy time: During market dips (15-20% corrections)</li>
                <li>Suggested position size: 25% of available funds</li>
                <li>Market sentiment: Neutral with bullish bias</li>
              </ul>
            ) : (
              <span className="text-gray-500 italic"> Enable AI for insights</span>
            )}
          </p>
        </div>

        <button 
          className="w-full px-4 py-2 bg-[#666666] hover:bg-[#777777] 
                     text-white font-bold rounded border border-black/20"
        >
          Start DCA Strategy
        </button>
      </div>
    </div>
  )
} 