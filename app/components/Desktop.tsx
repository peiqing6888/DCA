'use client'

import { useState, useRef, useEffect } from 'react'
import DCAApp from './DCAApp'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

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
  initialPosition?: Position
  initialSize?: Size
}

const Window = ({ 
  title, 
  isOpen, 
  onClose, 
  children, 
  initialPosition = { x: 50, y: 50 },
  initialSize = { width: 320, height: 240 }
}: WindowProps) => {
  const [position, setPosition] = useState<Position>(initialPosition)
  const [size, setSize] = useState<Size>(initialSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [preMaximizeState, setPreMaximizeState] = useState<{
    position: Position,
    size: Size
  } | null>(null)
  
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      } else if (isResizing) {
        if (!windowRef.current) return
        const rect = windowRef.current.getBoundingClientRect()
        const newWidth = Math.max(320, e.clientX - rect.left)
        const newHeight = Math.max(240, e.clientY - rect.top)
        setSize({ width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current && !isMaximized) {
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isMaximized) {
      setIsResizing(true)
    }
  }

  const handleMaximize = () => {
    if (isMaximized) {
      if (preMaximizeState) {
        setPosition(preMaximizeState.position)
        setSize(preMaximizeState.size)
      }
    } else {
      setPreMaximizeState({ position, size })
      setPosition({ x: 0, y: 25 }) // Account for menu bar
      setSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - 25 // Account for menu bar
      })
    }
    setIsMaximized(!isMaximized)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
    // In a real implementation, we would animate the window to the dock
    // For now, we'll just hide it and show it again when clicking the icon
  }

  if (!isOpen || isMinimized) return null

  return (
    <div 
      ref={windowRef}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      className={`fixed bg-[#D8D8D8] border-[2px] border-black rounded shadow-xl
                select-none overflow-hidden
                ${isDragging ? 'cursor-grabbing' : ''}
                ${isMaximized ? 'transition-all duration-200' : ''}`}
    >
      {/* Window Header */}
      <div 
        onMouseDown={handleMouseDown}
        onDoubleClick={handleMaximize}
        className={`bg-gradient-to-r from-[#666666] to-[#999999] px-2 py-1 
                   flex items-center justify-between border-b border-black
                   cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose}
            className="w-3 h-3 bg-[#FC5753] rounded-full hover:opacity-80 border border-[#DF4744]"
          />
          <button 
            onClick={handleMinimize}
            className="w-3 h-3 bg-[#FDBC40] rounded-full hover:opacity-80 border border-[#DE9F34]"
          />
          <button 
            onClick={handleMaximize}
            className="w-3 h-3 bg-[#33C748] rounded-full hover:opacity-80 border border-[#27AA35]"
          />
        </div>
        <span className="text-sm font-bold text-white drop-shadow select-none">{title}</span>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Window Content */}
      <div className="p-4 bg-[#ECECEC] h-[calc(100%-28px)] overflow-auto">
        {children}
      </div>

      {/* Window Resize Handle */}
      {!isMaximized && (
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        >
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-gray-400"
          >
            <path
              fill="currentColor"
              d="M11 11v4h4v-4h-4zm1 1h2v2h-2v-2z"
            />
          </svg>
        </div>
      )}
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
      {/* Menu Bar */}
      <div className="fixed top-0 left-0 right-0 h-5 bg-gradient-to-b from-[#FFFFFF] to-[#D8D8D8] border-b border-black/20 flex items-center px-2 z-50">
        <div className="flex items-center gap-4">
          <img src="/apple-logo.svg" alt="Apple" className="h-3 w-3" />
          <span className="text-xs font-bold">File</span>
          <span className="text-xs font-bold">Edit</span>
          <span className="text-xs font-bold">View</span>
          <span className="text-xs font-bold">Special</span>
          <span className="text-xs font-bold">Help</span>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="grid grid-cols-6 gap-4 mt-6">
        <DesktopIcon 
          name="DCA AI"
          icon="/dca-icon.png"
          onClick={() => toggleWindow('dca')}
        />
      </div>

      {/* Windows */}
      <Window 
        title="DCA AI Strategy"
        isOpen={openWindows.dca}
        onClose={() => toggleWindow('dca')}
        initialPosition={{ x: 100, y: 100 }}
        initialSize={{ width: 320, height: 240 }}
      >
        <DCAApp />
      </Window>
    </div>
  )
} 