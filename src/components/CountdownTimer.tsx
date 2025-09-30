import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

const calculateTimeLeft = (targetDate: string) => {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }
  return timeLeft;
};

const TimeValue: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-bold text-slate-700 tracking-wider">
            {String(value).padStart(2, '0')}
        </span>
        <span className="text-xs sm:text-sm uppercase text-slate-500 mt-1">{label}</span>
    </div>
);


const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    
    return () => clearTimeout(timer);
  });
  
  const formattedDate = new Date(targetDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border text-center">
        <h2 className="text-2xl font-bold text-slate-800 font-serif mb-2">The Big Reveal is Coming!</h2>
        <p className="text-gray-600 mb-6">
            Come back after <strong className="text-[var(--primary-text)]">{formattedDate}</strong> to see who everyone else got!
        </p>

        <div className="flex justify-center items-center gap-4 sm:gap-8 p-4 bg-slate-50 rounded-xl border max-w-md mx-auto">
            <TimeValue value={timeLeft.days} label="Days" />
            <span className="text-4xl font-bold text-slate-300 -mt-4">:</span>
            <TimeValue value={timeLeft.hours} label="Hours" />
            <span className="text-4xl font-bold text-slate-300 -mt-4">:</span>
            <TimeValue value={timeLeft.minutes} label="Minutes" />
            <span className="text-4xl font-bold text-slate-300 -mt-4">:</span>
            <TimeValue value={timeLeft.seconds} label="Seconds" />
        </div>
    </div>
  );
};

export default CountdownTimer;
