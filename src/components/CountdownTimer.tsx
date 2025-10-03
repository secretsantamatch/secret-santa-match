import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: number; // timestamp
  onComplete: () => void;
}

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onComplete }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDate - Date.now();
    if (difference <= 0) {
      return {};
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.keys(newTimeLeft).length === 0) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const timerComponents: React.ReactElement[] = [];
  let hasStarted = false;

  (Object.keys(timeLeft) as Array<keyof TimeLeft>).forEach((interval) => {
    const value = timeLeft[interval];
    if (value === undefined) return;

    if (value > 0) hasStarted = true;
    if (!hasStarted && interval !== 'seconds') return;

    timerComponents.push(
      <div key={interval} className="text-center">
        <span className="text-4xl lg:text-5xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="block text-sm uppercase tracking-wider">{interval}</span>
      </div>
    );
  });

  if (timerComponents.length === 0) {
     return <div className="text-xl font-semibold">Revealing now...</div>;
  }

  return (
    <div className="flex justify-center items-center gap-4 text-white">
      {timerComponents}
    </div>
  );
};

export default CountdownTimer;
