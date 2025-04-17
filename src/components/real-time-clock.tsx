'use client';

import { useState, useEffect } from 'react';

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format time as HH:MM:SS AM/PM
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Format date as Day Month DD, YYYY
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return (
    <div className="flex flex-col items-center md:items-end">
      <div className="flex items-center">
        <div className="bg-red-600 text-white font-bold px-2 py-1 rounded">
          {formattedTime}
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {formattedDate}
      </div>
    </div>
  );
}
