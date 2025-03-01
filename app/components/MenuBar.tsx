'use client';

import AppleLogo from './AppleLogo';
import { useState, useEffect } from 'react';

export default function MenuBar() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [isRainbow, setIsRainbow] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (item: string) => {
    setActiveItem(item);
    setClickCount(prev => prev + 1);

    // Trigger rainbow effect when click count reaches target
    if (clickCount + 1 === 7) {
      setIsRainbow(true);
      setTimeout(() => setIsRainbow(false), 3000);
      setClickCount(0);
    }

    const timer = setTimeout(() => {
      setActiveItem(null);
    }, 500);

    return () => clearTimeout(timer);
  };

  // Handle Apple Logo click
  const handleLogoClick = () => {
    const audio = new Audio('/retro-click.mp3'); // Need to add sound effect file
    audio.play().catch(() => {}); // Ignore potential playback errors
  };

  return (
    <div className={`bg-[#DDDDDD] border-b border-black flex items-center h-[33px] px-3 justify-between transition-all duration-500 ${isRainbow ? 'rainbow-bg' : ''}`}>
      <div className="flex items-center space-x-5">
        {/* Apple Logo */}
        <div 
          className="flex items-center justify-center w-7 h-7 -mt-1 cursor-pointer transform hover:scale-105 transition-transform"
          onClick={handleLogoClick}
        >
          <AppleLogo />
        </div>
        
        {/* Menu Items */}
        <div className="flex space-x-5 text-sm">
          {['File', 'Edit', 'View', 'Special'].map((item) => (
            <span
              key={item}
              onClick={() => handleMenuClick(item)}
              className={`cursor-default transition-all duration-200 px-2 py-0.5 rounded-sm
                ${activeItem === item ? 'bg-black text-white transform scale-105' : 'hover:bg-black/10'}
                ${isRainbow ? 'rainbow-text' : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Time Display */}
      <div className="text-sm font-chicago">
        {time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}
      </div>

      <style jsx>{`
        @keyframes rainbow-bg {
          0% { background: #ff0000; }
          17% { background: #ff8000; }
          33% { background: #ffff00; }
          50% { background: #00ff00; }
          67% { background: #0000ff; }
          83% { background: #8000ff; }
          100% { background: #ff0000; }
        }

        @keyframes rainbow-text {
          0% { color: #ff0000; }
          17% { color: #ff8000; }
          33% { color: #ffff00; }
          50% { color: #00ff00; }
          67% { color: #0000ff; }
          83% { color: #8000ff; }
          100% { color: #ff0000; }
        }

        .rainbow-bg {
          animation: rainbow-bg 3s linear infinite;
        }

        .rainbow-text {
          animation: rainbow-text 3s linear infinite;
        }
      `}</style>
    </div>
  );
} 