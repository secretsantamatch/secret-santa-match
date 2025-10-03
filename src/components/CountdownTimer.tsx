import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    targetTime?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, targetTime }) => {
    const getTargetDateTime = () => {
        const [year, month, day] = targetDate.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        
        if (targetTime) {
            const [hours, minutes] = targetTime.split(':').map(Number);
            date.setUTCHours(hours, minutes, 0, 0);
        }
        return date;
    };

    const [targetDateTime, setTargetDateTime] = useState(getTargetDateTime());

    const calculateTimeLeft = () => {
        const difference = +targetDateTime - +new Date();
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
        setTargetDateTime(getTargetDateTime());
    }, [targetDate, targetTime]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents: React.ReactElement[] = Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">{String(value).padStart(2, '0')}</div>
            <div className="text-xs sm:text-sm uppercase tracking-wider">{unit}</div>
        </div>
    ));

    const formattedDate = new Date(targetDate + 'T00:00:00Z').toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    const formattedTime = targetTime ? new Date(`1970-01-01T${targetTime}Z`).toLocaleTimeString(undefined, {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    }) : '';

    if (!timerComponents.length) {
        return <p className="font-bold text-lg text-green-600">The results are revealed!</p>;
    }

    return (
        <div className="text-slate-700">
             <p className="text-center text-slate-600 mb-4">
                Come back after <span className="font-bold text-[var(--primary-text)]">{formattedDate}</span>
                {formattedTime && <span className="font-bold text-[var(--primary-text)]"> at {formattedTime}</span>} to see who everyone else got!
            </p>
            <div className="flex justify-center gap-4 sm:gap-6">
                {timerComponents}
            </div>
        </div>
    );
};

export default CountdownTimer;
