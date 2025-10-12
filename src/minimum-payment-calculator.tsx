import React, { useState } from 'react';

const MinimumPaymentCalculator: React.FC = () => {
    const [balance, setBalance] = useState<string>('1000');
    const [apr, setApr] = useState<string>('19.99');
    const [minPaymentPercent, setMinPaymentPercent] = useState<string>('2');
    const [result, setResult] = useState<{ months: number; totalInterest: number; totalPaid: number } | null>(null);
    const [error, setError] = useState<string>('');

    const calculate = () => {
        setError('');
        setResult(null);

        const numBalance = parseFloat(balance);
        const numApr = parseFloat(apr);
        const numMinPaymentPercent = parseFloat(minPaymentPercent);

        if (isNaN(numBalance) || isNaN(numApr) || isNaN(numMinPaymentPercent) || numBalance <= 0 || numApr < 0 || numMinPaymentPercent <= 0) {
            setError('Please enter valid, positive numbers for all fields.');
            return;
        }

        let currentBalance = numBalance;
        let totalInterest = 0;
        let months = 0;
        const monthlyInterestRate = numApr / 100 / 12;

        while (currentBalance > 0) {
            months++;
            const interestForMonth = currentBalance * monthlyInterestRate;
            
            let payment = currentBalance * (numMinPaymentPercent / 100);
            payment = Math.max(payment, 25); // Common minimum payment, e.g., $25
            
            if (payment <= interestForMonth) {
                setError('The minimum payment is not enough to cover the interest. The balance will never be paid off.');
                return;
            }

            if (payment > currentBalance + interestForMonth) {
                payment = currentBalance + interestForMonth;
            }

            currentBalance += interestForMonth;
            totalInterest += interestForMonth;
            currentBalance -= payment;

            if (months > 1200) { // Safety break for 100 years
                setError('Calculation is taking too long. The balance may not be paid off under these conditions.');
                return;
            }
        }

        setResult({
            months: months,
            totalInterest: totalInterest,
            totalPaid: numBalance + totalInterest,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const formatYearsAndMonths = (totalMonths: number) => {
        if (totalMonths <= 0) return '0 months';
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        let result = '';
        if (years > 0) {
            result += `${years} year${years > 1 ? 's' : ''}`;
        }
        if (months > 0) {
            if (years > 0) result += ', ';
            result += `${months} month${months > 1 ? 's' : ''}`;
        }
        return result;
    };

    return (
        <div className="bg-slate-50 min-h-screen py-10">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-orange-500 font-serif">Minimum Payment Calculator</h1>
                    <p className="text-base text-gray-600 mt-4 max-w-3xl mx-auto">
                        See how long it will take to pay off your credit card balance by making only the minimum payments.
                    </p>
                </header>

                <main className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="balance" className="block text-lg font-semibold text-slate-700 mb-2">
                                Credit Card Balance ($)
                            </label>
                            <input
                                type="number"
                                id="balance"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div>
                            <label htmlFor="apr" className="block text-lg font-semibold text-slate-700 mb-2">
                                Annual Percentage Rate (APR) (%)
                            </label>
                            <input
                                type="number"
                                id="apr"
                                value={apr}
                                onChange={(e) => setApr(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="e.g., 19.99"
                            />
                        </div>
                        <div>
                            <label htmlFor="min-payment" className="block text-lg font-semibold text-slate-700 mb-2">
                                Minimum Payment (% of balance)
                            </label>
                            <input
                                type="number"
                                id="min-payment"
                                value={minPaymentPercent}
                                onChange={(e) => setMinPaymentPercent(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="e.g., 2"
                            />
                            <p className="text-sm text-slate-500 mt-1">Most cards use 1-3% or a flat fee (e.g., $25), whichever is greater. This calculator assumes a minimum payment of at least $25.</p>
                        </div>
                        <div className="text-center pt-2">
                            <button
                                onClick={calculate}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out"
                            >
                                Calculate
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg text-center font-semibold">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 border-t-2 border-slate-200 pt-8">
                            <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-6">Your Payoff Plan</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                                    <p className="text-lg text-slate-600 font-semibold">Time to Pay Off</p>
                                    <p className="text-4xl font-bold text-orange-500">{formatYearsAndMonths(result.months)}</p>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                                        <p className="text-lg text-slate-600 font-semibold">Total Interest Paid</p>
                                        <p className="text-3xl font-bold text-orange-500">{formatCurrency(result.totalInterest)}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                                        <p className="text-lg text-slate-600 font-semibold">Total Amount Paid</p>
                                        <p className="text-3xl font-bold text-orange-500">{formatCurrency(result.totalPaid)}</p>
                                    </div>
                                </div>
                                <div className="text-center text-sm text-slate-500 pt-2">
                                    Based on an initial balance of {formatCurrency(parseFloat(balance) || 0)}.
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                <footer className="text-center py-8 mt-8">
                    <div className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-lg border">
                        <h3 className="font-bold text-lg text-slate-800">Disclaimer</h3>
                        <p className="mt-2">This calculator is for illustrative purposes only and the results are an estimate. It assumes a fixed interest rate and that you make no additional charges. Your credit card issuer may calculate the minimum payment differently. Please refer to your credit card agreement for exact terms.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MinimumPaymentCalculator;
