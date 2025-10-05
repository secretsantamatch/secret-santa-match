import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    targetTime?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, targetTime }) => {
    const getTargetDateTime = () => {
        const time = targetTime || '00:00';
        // Combine date and time and interpret as a UTC timestamp to ensure consistency across timezones
        return new Date(`${targetDate}T${time}:00Z`);
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
    
    const formattedDateTime = targetDateTime.toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: targetTime ? 'numeric' : undefined,
        minute: targetTime ? 'numeric' : undefined,
        timeZone: 'UTC',
        hour12: true,
    });


    if (!timerComponents.length) {
        return <p className="font-bold text-lg text-green-600">The results are revealed!</p>;
    }

    return (
        <div className="text-slate-700">
             <p className="text-center text-slate-600 mb-4">
                Come back after <span className="font-bold text-[var(--primary-text)]">{formattedDateTime} (UTC)</span> to see who everyone else got!
            </p>
            <div className="flex justify-center gap-4 sm:gap-6">
                {timerComponents}
            </div>
        </div>
    );
};

export default CountdownTimer;
