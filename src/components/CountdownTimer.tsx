import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: number;
  onComplete: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetTime, onComplete }) => {
  const calculateTimeLeft = () => {
    const difference = targetTime - new Date().getTime();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.values(newTimeLeft).every(v => v === 0)) {
        onComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: React.ReactElement[] = [];
  Object.keys(timeLeft).forEach((interval) => {
    const key = interval as keyof typeof timeLeft;
    if (timeLeft[key] === undefined) return;
    
    timerComponents.push(
      <div key={key} className="flex flex-col items-center">
        <span className="text-4xl md:text-6xl font-bold text-slate-700 tracking-wider">
          {String(timeLeft[key]).padStart(2, '0')}
        </span>
        <span className="text-sm text-slate-500 uppercase tracking-widest">{interval}</span>
      </div>
    );
  });
  
  const targetDate = new Date(targetTime);
  const formattedDate = targetDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = targetDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="text-center">
      <h3 className="text-3xl font-bold font-serif text-slate-800">The Big Reveal is Coming!</h3>
      <p className="text-slate-600 mt-2">
        Come back after <span className="font-semibold text-slate-700">{formattedDate}</span> at <span className="font-semibold text-slate-700">{formattedTime}</span> to see who everyone else got!
      </p>
      <div className="flex justify-center items-center gap-4 md:gap-8 mt-6">
        {timerComponents.map((component, index) => (
          <React.Fragment key={index}>
            {component}
            {index < timerComponents.length - 1 && <span className="text-4xl md:text-6xl text-slate-300 pb-4">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
