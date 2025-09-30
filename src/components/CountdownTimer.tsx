import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

const calculateTimeLeft = (target: Date) => {
    const difference = +target - +new Date();
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

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);
    
    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-6xl font-bold text-slate-700 bg-white shadow-md rounded-lg p-4 w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
                {String(value).padStart(2, '0')}
            </div>
            <div className="text-sm sm:text-base font-semibold text-slate-500 uppercase tracking-wider mt-2">
                {label}
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 bg-slate-100 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Who Got Who?</h2>
            <p className="text-slate-600 mb-6">The full list of matches will be revealed after the gift exchange date!</p>
            <div className="flex justify-center items-center gap-2 sm:gap-4">
                <TimeBlock value={timeLeft.days} label="Days" />
                <span className="text-4xl font-bold text-slate-400 pb-8">:</span>
                <TimeBlock value={timeLeft.hours} label="Hours" />
                <span className="text-4xl font-bold text-slate-400 pb-8">:</span>
                <TimeBlock value={timeLeft.minutes} label="Minutes" />
                <span className="text-4xl font-bold text-slate-400 pb-8">:</span>
                <TimeBlock value={timeLeft.seconds} label="Seconds" />
            </div>
        </div>
    );
};

export default CountdownTimer;
