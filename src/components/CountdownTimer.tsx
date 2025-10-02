import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: { [key: string]: number } = {};

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

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    // FIX: Changed JSX.Element[] to React.ReactElement[] to resolve namespace error.
    const timerComponents: React.ReactElement[] = [];
    const timeUnits = ['days', 'hours', 'minutes', 'seconds'];

    timeUnits.forEach(interval => {
        if (timeLeft[interval] !== undefined) {
             timerComponents.push(
                <div key={interval} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold">{timeLeft[interval]}</div>
                    <div className="text-xs sm:text-sm uppercase tracking-wider">{interval}</div>
                </div>
            );
        }
    });

    if (!timerComponents.length) {
        return null; // Timer has finished
    }

    return (
        <div className="flex justify-center gap-4 sm:gap-8 text-slate-700">
            {timerComponents}
        </div>
    );
};

export default CountdownTimer;
