'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '@/lib/sounds'
import DCAStrategy from './DCAStrategy'
import AboutComputer from './AboutComputer'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface WindowState {
  id: string
  title: string
  icon: string
  isOpen: boolean
  isMinimized: boolean
  zIndex: number
  component: React.ReactNode
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
  isMinimized: boolean
  zIndex: number
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
  children: React.ReactNode
  initialPosition?: Position
  initialSize?: Size
  dockPosition?: Position
}

const Window = ({ 
  title, 
  isOpen, 
  isMinimized,
  zIndex,
  onClose, 
  onMinimize,
  onFocus,
  children, 
  initialPosition = { x: 50, y: 50 },
  initialSize = { width: 320, height: 240 },
  dockPosition
}: WindowProps) => {
  const [position, setPosition] = useState<Position>(initialPosition)
  const [size, setSize] = useState<Size>(initialSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
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

  const handleClose = () => {
    soundManager.play('close')
    onClose()
  }

  const handleMinimize = () => {
    soundManager.play('minimize')
    onMinimize()
  }

  const handleMaximize = () => {
    soundManager.play(isMaximized ? 'restore' : 'maximize')
    if (isMaximized) {
      if (preMaximizeState) {
        setPosition(preMaximizeState.position)
        setSize(preMaximizeState.size)
      }
    } else {
      setPreMaximizeState({ position, size })
      setPosition({ x: 0, y: 25 })
      setSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - 25
      })
    }
    setIsMaximized(!isMaximized)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        ref={windowRef}
        initial={dockPosition ? {
          ...dockPosition,
          scale: 0.5,
          opacity: 0
        } : {
          scale: 0.95,
          opacity: 0,
          y: -20
        }}
        animate={{
          left: isMinimized ? (dockPosition?.x || 0) : position.x,
          top: isMinimized ? (dockPosition?.y || 0) : position.y,
          width: isMinimized ? 48 : size.width,
          height: isMinimized ? 48 : size.height,
          scale: 1,
          opacity: isDragging ? 0.6 : 1,
          y: 0
        }}
        exit={{
          scale: 0.9,
          opacity: 0,
          y: 20
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        style={{
          zIndex
        }}
        onMouseDown={onFocus}
        className={`fixed bg-[#D8D8D8] border-[2px] border-black rounded shadow-xl
                  select-none overflow-hidden backdrop-blur-sm
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
              onClick={handleClose}
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
      </motion.div>
    </AnimatePresence>
  )
}

const Dock = ({ 
  minimizedWindows,
  onRestore 
}: { 
  minimizedWindows: WindowState[]
  onRestore: (id: string) => void
}) => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                    bg-[#D8D8D8] border-2 border-black rounded-lg shadow-xl
                    flex items-center gap-2">
      {minimizedWindows.map((window) => (
        <motion.div
          key={window.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded bg-white/50 p-1 cursor-pointer
                     hover:bg-white/80 transition-colors border border-black/20"
          onClick={() => onRestore(window.id)}
        >
          <img src={window.icon} alt={window.title} className="w-full h-full pixelated" />
        </motion.div>
      ))}
    </div>
  )
}

export default function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([{
    id: 'dca',
    title: 'DCA AI Strategy',
    icon: '/dca-icon.png',
    isOpen: true,
    isMinimized: false,
    zIndex: 0,
    component: <DCAStrategy />
  }, {
    id: 'about',
    title: 'About This Computer',
    icon: '/ryos-logo.png',
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    component: <AboutComputer />
  }])
  const [topZIndex, setTopZIndex] = useState(1)
  const [windowHeight, setWindowHeight] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
    const handleResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(null)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const toggleWindow = (id: string) => {
    setWindows(prev => prev.map(window => {
      if (window.id === id) {
        if (!window.isOpen) {
          bringToFront(id)
          return { ...window, isOpen: true, isMinimized: false }
        }
        return { ...window, isOpen: !window.isOpen }
      }
      return window
    }))
  }

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(window => 
      window.id === id ? { ...window, isMinimized: true } : window
    ))
  }

  const restoreWindow = (id: string) => {
    setWindows(prev => prev.map(window => {
      if (window.id === id) {
        bringToFront(id)
        return { ...window, isMinimized: false }
      }
      return window
    }))
  }

  const bringToFront = (id: string) => {
    setTopZIndex(prev => prev + 1)
    setWindows(prev => prev.map(window => 
      window.id === id ? { ...window, zIndex: topZIndex + 1 } : window
    ))
  }

  const minimizedWindows = windows.filter(w => w.isOpen && w.isMinimized)
  const visibleWindows = windows.filter(w => w.isOpen)

  const handleMenuClick = (menu: string) => {
    soundManager.play('click')
    setIsMenuOpen(isMenuOpen === menu ? null : menu)
  }

  const menuItems = {
    apple: [
      { 
        label: 'About This Computer', 
        action: () => {
          const aboutWindow = windows.find(w => w.id === 'about')
          if (aboutWindow && !aboutWindow.isOpen) {
            toggleWindow('about')
          }
          bringToFront('about')
        }
      },
      { label: 'Control Panels', action: () => {} },
      { label: 'System Settings', action: () => {} },
    ],
    file: [
      { label: 'New Window', action: () => {} },
      { label: 'Close Window', action: () => {} },
      { label: 'Save', action: () => {} },
    ],
    edit: [
      { label: 'Cut', action: () => {} },
      { label: 'Copy', action: () => {} },
      { label: 'Paste', action: () => {} },
    ],
    view: [
      { label: 'Clean Up', action: () => {} },
      { label: 'View Options...', action: () => {} },
    ],
    special: [
      { label: 'Empty Trash...', action: () => {} },
      { label: 'Eject Disk', action: () => {} },
      { label: 'Sound Settings', action: () => soundManager.toggle() },
    ],
  }

  return (
    <div className="min-h-screen bg-[url('/wallpaper.jpg')] bg-cover bg-center p-4">
      {/* Menu Bar */}
      <div 
        ref={menuRef}
        className="fixed top-0 left-0 right-0 h-5 bg-gradient-to-b from-[#FFFFFF] to-[#D8D8D8] border-b border-black/20 flex items-center px-2 z-50"
      >
        <div className="flex items-center gap-4">
          {Object.entries(menuItems).map(([key, items]) => (
            <div key={key} className="relative">
              <span 
                className={`text-xs font-bold cursor-default px-2 py-0.5 rounded select-none
                          ${isMenuOpen === key ? 'bg-black text-white' : 'hover:bg-black/10'}`}
                onClick={() => handleMenuClick(key)}
              >
                {key === 'apple' ? (
                  <img src="/apple-3.png" alt="Apple" className="h-3 w-3 inline" />
                ) : (
                  key.charAt(0).toUpperCase() + key.slice(1)
                )}
              </span>
              {isMenuOpen === key && (
                <div 
                  className="absolute top-full left-0 mt-1
                            bg-[#D8D8D8] border-2 border-black rounded shadow-lg
                            min-w-[200px] py-1 animate-in fade-in slide-in-from-top-2
                            backdrop-blur-sm bg-opacity-95"
                >
                  {items.map((item, index) => (
                    <div key={item.label}>
                      <div 
                        className="px-4 py-1.5 hover:bg-black hover:text-white cursor-default
                                 transition-colors duration-100 select-none"
                        onClick={() => {
                          soundManager.play('click')
                          item.action()
                          setIsMenuOpen(null)
                        }}
                      >
                        {item.label}
                      </div>
                      {index < items.length - 1 && (
                        <div className="h-px bg-black/20 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="select-none">{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="grid grid-cols-6 gap-4 mt-6">
        {windows.filter(window => window.id !== 'about').map(window => (
          <DesktopIcon 
            key={window.id}
            name={window.title}
            icon={window.icon}
            onClick={() => toggleWindow(window.id)}
          />
        ))}
      </div>

      {/* Windows */}
      {visibleWindows.map(window => (
        <Window 
          key={window.id}
          title={window.title}
          isOpen={window.isOpen}
          isMinimized={window.isMinimized}
          zIndex={window.zIndex}
          onClose={() => toggleWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onFocus={() => bringToFront(window.id)}
          initialPosition={{ x: window.id === 'about' ? 200 : 100, y: window.id === 'about' ? 100 : 50 }}
          initialSize={{ 
            width: window.id === 'about' ? 400 : 480, 
            height: window.id === 'about' ? 200 : 640 
          }}
          dockPosition={window.isMinimized ? { 
            x: window.zIndex * 60, 
            y: windowHeight - 60
          } : undefined}
        >
          {window.component}
        </Window>
      ))}

      {/* Dock */}
      {minimizedWindows.length > 0 && (
        <Dock 
          minimizedWindows={minimizedWindows}
          onRestore={restoreWindow}
        />
      )}
    </div>
  )
} 