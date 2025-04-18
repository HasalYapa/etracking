import { useState, useEffect } from 'react';

export default function TypeWriter({ text, speed = 100, className = '' }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={`${className} ${isComplete ? 'after:content-["_"]' : 'after:content-["|"] after:animate-blink'}`}>
      {displayText}
    </span>
  );
}
