import React, { useState, useEffect } from 'react';

export default function ReservationTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [critical, setCritical] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      if (minutes < 3) {
        setCritical(true);
      } else {
        setCritical(false);
      }

      setTimeLeft(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs uppercase tracking-wider ${
      critical 
        ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' 
        : 'bg-[#ff5500]/5 border-[#ff5500]/10 text-[#ff5500]'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>HOLDING STOCK: {timeLeft}</span>
    </div>
  );
}
