'use client'

import { useState } from 'react'
import DCAApp from './DCAApp'

interface DesktopIconProps {
  name: string
  icon: string
  onClick?: () => void
}

const DesktopIcon = ({ name, icon, onClick }: DesktopIconProps) => {
  return (
    <div 
      className="flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-black/10"
      onClick={onClick}
    >
      <img src={icon} alt={name} className="w-12 h-12 pixelated" />
      <span className="text-sm text-white drop-shadow-md">{name}</span>
    </div>
  )
}

interface WindowProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Window = ({ title, isOpen, onClose, children }: WindowProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-[#D8D8D8] border-2 border-black rounded shadow-xl
                    min-w-[320px] min-h-[240px]">
      <div className="bg-gradient-to-r from-[#666666] to-[#999999] px-2 py-1 
                     flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose}
            className="w-3 h-3 bg-[#FC5753] rounded-full hover:opacity-80"
          />
        </div>
        <span className="text-sm font-bold text-white drop-shadow">{title}</span>
        <div className="w-3" /> {/* Spacer */}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default function Desktop() {
  const [openWindows, setOpenWindows] = useState<{[key: string]: boolean}>({
    dca: false,
  })

  const toggleWindow = (name: string) => {
    setOpenWindows(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  return (
    <div className="min-h-screen bg-[url('/wallpaper.jpg')] bg-cover bg-center p-4">
      <div className="grid grid-cols-6 gap-4">
        <DesktopIcon 
          name="DCA AI"
          icon="/dca-icon.png"
          onClick={() => toggleWindow('dca')}
        />
      </div>

      <Window 
        title="DCA AI Strategy"
        isOpen={openWindows.dca}
        onClose={() => toggleWindow('dca')}
      >
        <DCAApp />
      </Window>
    </div>
  )
} 