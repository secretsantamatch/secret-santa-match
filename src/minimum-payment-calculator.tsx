import React, { useState, useMemo } from 'react';

const MinimumPaymentCalculator: React.FC = () => {
    const [balance, setBalance] = useState<number | ''>(5000);
    const [apr, setApr] = useState<number | ''>(19.99);
    const [minPaymentPercent, setMinPaymentPercent] = useState<number | ''>(2);
    const [extraPayment, setExtraPayment] = useState<number | ''>(0);

    const { months, totalInterest, totalPaid, firstPayment } = useMemo(() => {
        const numBalance = Number(balance) || 0;
        const numApr = Number(apr) || 0;
        const numMinPaymentPercent = Number(minPaymentPercent) || 0;
        const numExtraPayment = Number(extraPayment) || 0;

        if (numBalance <= 0 || numApr <= 0) {
            return { months: 0, totalInterest: 0, totalPaid: 0, firstPayment: 0 };
        }
        
        const monthlyRate = numApr / 100 / 12;
        let currentBalance = numBalance;
        let months = 0;
        let totalInterestPaid = 0;
        let firstPayment = 0;

        while (currentBalance > 0.01 && months < 480) { // Max 40 years, check for small balance
            months++;
            const interestThisMonth = currentBalance * monthlyRate;

            let minPayment = (currentBalance * (numMinPaymentPercent / 100)) + interestThisMonth;
            
            // Minimum payment floor rule
            if (currentBalance + interestThisMonth < 25) {
                minPayment = currentBalance + interestThisMonth;
            } else {
                minPayment = Math.max(minPayment, 25);
            }
            
            let payment = minPayment + numExtraPayment;
            
            if (months === 1) {
                firstPayment = payment;
            }
            
            if (payment >= currentBalance + interestThisMonth) {
                payment = currentBalance + interestThisMonth;
            }
            
            // If payment doesn't cover interest, it's an infinite loop
            if (payment <= interestThisMonth && numExtraPayment <= 0) {
                return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, firstPayment: payment };
            }

            const principalPaid = payment - interestThisMonth;
            currentBalance -= principalPaid;
            totalInterestPaid += interestThisMonth;
        }

        if (months >= 480 && currentBalance > 0.01) {
            return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, firstPayment: firstPayment };
        }

        return {
            months,
            totalInterest: totalInterestPaid,
            totalPaid: numBalance + totalInterestPaid,
            firstPayment,
        };
    }, [balance, apr, minPaymentPercent, extraPayment]);

    const renderTime = () => {
        if (months === Infinity) {
            return <p className="text-xl font-semibold text-red-600">Never (payment is too low)</p>;
        }
        if (months === 0) {
            return <p className="text-xl font-semibold text-slate-700">-</p>;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        let result = '';
        if (years > 0) {
            result += `${years} year${years > 1 ? 's' : ''}`;
        }
        if (remainingMonths > 0) {
            if (years > 0) result += ' and ';
            result += `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
        }
        return <p className="text-xl font-semibold text-slate-700">{result || 'Less than a month'}</p>;
    };

    const formatCurrency = (value: number) => {
        if (value === Infinity) {
            return 'Endless';
        }
        if (!value || value <= 0) {
            return '-';
        }
        return `$${value.toFixed(2)}`;
    };
    
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
                    <div className="flex justify-between items-center">
                        <a href="/" className="flex items-center gap-3">
                            <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16" />
                            <span className="hidden sm:inline text-xl font-bold text-slate-700">SecretSantaMatch.com</span>
                        </a>
                         <a href="/" className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-2 px-5 text-md rounded-full shadow-md transform hover:scale-105 transition-all">
                            &larr; Back to Generator
                        </a>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-orange-500 font-serif">Credit Card Minimum Payment Calculator</h1>
                    <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
                        See how long it will take to pay off your credit card balance by making only the minimum payments, and how much you can save with extra payments.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Enter Your Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="balance" className="block text-sm font-medium text-slate-700">Card Balance ($)</label>
                                <input
                                    type="number"
                                    id="balance"
                                    value={balance}
                                    onChange={e => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 p-2 block w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 5000"
                                />
                            </div>
                            <div>
                                <label htmlFor="apr" className="block text-sm font-medium text-slate-700">Interest Rate (APR %)</label>
                                <input
                                    type="number"
                                    id="apr"
                                    value={apr}
                                    onChange={e => setApr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 p-2 block w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 19.99"
                                />
                            </div>
                            <div>
                                <label htmlFor="min-payment" className="block text-sm font-medium text-slate-700">Minimum Payment (% of balance)</label>
                                <input
                                    type="number"
                                    id="min-payment"
                                    value={minPaymentPercent}
                                    onChange={e => setMinPaymentPercent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 p-2 block w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 2"
                                />
                                <p className="text-xs text-slate-500 mt-1">Typically 1-3%. We add interest and assume a $25 minimum.</p>
                            </div>
                             <div>
                                <label htmlFor="extra-payment" className="block text-sm font-medium text-slate-700">Extra Monthly Payment ($)</label>
                                <input
                                    type="number"
                                    id="extra-payment"
                                    value={extraPayment}
                                    onChange={e => setExtraPayment(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 p-2 block w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Results</h2>
                        {Number(balance) > 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Estimated First Monthly Payment</p>
                                    <p className="text-3xl font-bold text-indigo-600">{formatCurrency(firstPayment)}</p>
                                </div>
                                <hr/>
                                <div>
                                    <p className="text-sm text-slate-500">Time to Pay Off</p>
                                    {renderTime()}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Interest Paid</p>
                                    <p className="text-xl font-semibold text-slate-700">{formatCurrency(totalInterest)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Amount Paid</p>
                                    <p className="text-xl font-semibold text-slate-700">{formatCurrency(totalPaid)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500">Enter your card details to see the results.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">How It Works</h2>
                    <div className="text-slate-600 space-y-2">
                        <p>
                            This calculator estimates the time and cost to pay off your credit card debt. Credit card companies often calculate the minimum payment as a small percentage of your balance (e.g., 1-3%) plus any interest and fees accrued that month. A minimum payment floor (often $25) is also common.
                        </p>
                        <p>
                            This means a large portion of your early payments goes toward interest, and it can take a surprisingly long time to pay off the principal. Adding even a small extra payment each month can dramatically reduce your payoff time and save you a significant amount in interest.
                        </p>
                        <p className="text-sm italic text-slate-500">
                            <strong>Disclaimer:</strong> This is an estimate for informational purposes only. Your actual payoff schedule may vary based on your card issuer's specific terms, fees, and payment calculations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinimumPaymentCalculator;
