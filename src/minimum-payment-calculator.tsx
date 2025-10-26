import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Trash2, PlusCircle, Banknote, Coffee, Utensils, Tv, Phone, Pizza, TreePalm, Share2, Download, BookOpen, AlertTriangle } from 'lucide-react';
import CalculatorResults from './components/CalculatorResults';
import type { CalculatorResult, Debt } from './types';

// FIX: Change gtag type to be consistent with other declarations in the project to avoid type errors.
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// FIX: Add trackEvent helper function to send analytics events.
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};

const MinimumPaymentCalculator: React.FC = () => {
    const [debts, setDebts] = useState<Debt[]>([
        { id: Date.now() + 1, name: 'Credit Card 1', balance: 5000, apr: 21.99, minPaymentPercent: 2, minPaymentFlat: 25 },
        { id: Date.now() + 2, name: 'Personal Loan', balance: 10000, apr: 9.5, minPaymentPercent: 0, minPaymentFlat: 250 },
    ]);
    const [results, setResults] = useState<CalculatorResult | null>(null);
    const [customPayment, setCustomPayment] = useState(100);
    const resultsRef = useRef<HTMLDivElement>(null);

    const addDebt = () => {
        setDebts([...debts, { id: Date.now(), name: `New Debt ${debts.length + 1}`, balance: 0, apr: 0, minPaymentPercent: 2, minPaymentFlat: 25 }]);
        trackEvent('add_debt_row', {});
    };

    const removeDebt = (id: number) => {
        setDebts(debts.filter(debt => debt.id !== id));
    };

    const handleDebtChange = (id: number, field: keyof Omit<Debt, 'id' | 'name'>, value: string) => {
        const numericValue = parseFloat(value);
        setDebts(debts.map(debt => debt.id === id ? { ...debt, [field]: isNaN(numericValue) ? 0 : numericValue } : debt));
    };
    
    const handleNameChange = (id: number, value: string) => {
        setDebts(debts.map(debt => debt.id === id ? { ...debt, name: value } : debt));
    };

    useEffect(() => {
        if (results && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [results]);

    const calculateMinimumPayment = (balance: number, percent: number, flat: number) => {
        return Math.max(flat, balance * (percent / 100));
    };

    const handleCalculate = () => {
        trackEvent('calculate_debt', {
            debt_count: debts.length,
            total_balance: debts.reduce((sum, d) => sum + d.balance, 0),
        });

        const calculatePayoff = (extraPayment: number) => {
            let localDebts: (Debt & { balance: number })[] = JSON.parse(JSON.stringify(debts.filter(d => d.balance > 0)));
            let months = 0;
            let totalInterest = 0;
            const initialPrincipal = localDebts.reduce((sum, d) => sum + d.balance, 0);

            while (localDebts.reduce((sum, d) => sum + d.balance, 0) > 0) {
                months++;
                if (months > 1200) { // Safety break for 100 years
                    return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
                }

                let totalMinPaymentThisMonth = 0;
                let monthlyInterest = 0;
                
                localDebts.forEach(debt => {
                    totalMinPaymentThisMonth += calculateMinimumPayment(debt.balance, debt.minPaymentPercent, debt.minPaymentFlat);
                    const interest = debt.balance * (debt.apr / 100 / 12);
                    monthlyInterest += interest;
                    debt.balance += interest;
                });
                totalInterest += monthlyInterest;

                let paymentRemaining = totalMinPaymentThisMonth + extraPayment;
                
                // Avalanche method: Highest APR first
                localDebts.sort((a, b) => b.apr - a.apr);
                
                const nextTempDebts: (Debt & { balance: number })[] = [];
                for (let debt of localDebts) {
                    if (paymentRemaining <= 0) {
                      nextTempDebts.push(debt);
                      continue;
                    };
                    const payment = Math.min(debt.balance, paymentRemaining);
                    debt.balance -= payment;
                    paymentRemaining -= payment;
                    if (debt.balance > 0.01) {
                        nextTempDebts.push(debt);
                    }
                }
                localDebts = nextTempDebts;
            }
            return { months, totalInterest, totalPaid: initialPrincipal + totalInterest };
        };

        const minPayResults = calculatePayoff(0);
        const customResults = calculatePayoff(customPayment);
        
        const totalPrincipal = debts.reduce((sum, d) => sum + d.balance, 0);
        const totalMinPayment = debts.reduce((sum, d) => sum + calculateMinimumPayment(d.balance, d.minPaymentPercent, d.minPaymentFlat), 0);
        
        const getEndDate = (start: Date, months: number) => {
            if (months === Infinity) return null;
            const endDate = new Date(start);
            endDate.setMonth(endDate.getMonth() + months);
            return endDate;
        };

        const now = new Date();
        const minPayEndDate = getEndDate(now, minPayResults.months);
        const customEndDate = getEndDate(now, customResults.months);
        
        const moneySavingTips = [
            { label: 'Cancel Subscriptions', amount: 50, description: "Review unused streaming services, apps, or gym memberships.", icon: Tv },
            { label: 'Brew Coffee at Home', amount: 100, description: "Skip the daily coffee shop run. A $5 coffee daily costs $150/month!", icon: Coffee },
            { label: 'Pack Your Lunch', amount: 200, description: "Bringing lunch to work instead of buying it can save a surprising amount.", icon: Utensils },
            { label: 'Eat Out Less', amount: 150, description: "Reduce restaurant meals and takeout. One less dinner out a week makes a big difference.", icon: Pizza },
            { label: 'Switch Phone Plans', amount: 40, description: "Compare carriers and switch to a cheaper plan that still meets your needs.", icon: Phone },
            { label: 'Optimize Thermostat', amount: 20, description: "Adjust your heating and cooling by a few degrees to save on your energy bill.", icon: TreePalm },
        ];
        
        setResults({
            totalMinPayment,
            scenarios: [{
                ...minPayResults,
                debtFreeYear: minPayEndDate ? minPayEndDate.getFullYear() : 'Never',
            }],
            customPaymentTotal: totalMinPayment + customPayment,
            customResults,
            customYear: customEndDate ? customEndDate.getFullYear() : 'Never',
            customInterestSaved: minPayResults.totalInterest - customResults.totalInterest,
            weightedAPR: totalPrincipal > 0 ? debts.reduce((acc, d) => acc + d.balance * d.apr, 0) / totalPrincipal : 0,
            interestVsPrincipal: [
                { name: 'Total Principal', value: totalPrincipal, fill: '#16a34a' },
                { name: `Interest with Min. Payments`, value: minPayResults.totalInterest, fill: '#ef4444' },
            ],
            moneySavingTips
        });
    };

    return (
    <>
        <nav className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <a href="https://secretsantamatch.com" className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <img src="/logo_256.png" alt="Logo" className="h-8 w-8" />
                        SecretSantaMatch
                    </a>
                    <a href="/" className="font-semibold text-slate-600 hover:text-indigo-600 text-sm">
                        &larr; Back to Blog
                    </a>
                </div>
            </div>
        </nav>
        <div className="bg-slate-50 min-h-screen font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif mb-3">Minimum Payment Calculator</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">See how much money you could save—and how quickly you could be debt-free—by paying more than the minimum.</p>
                </header>

                <main className="space-y-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><Banknote className="w-7 h-7 text-green-600" /> Enter Your Debts</h2>
                        <div id="debt-list" className="space-y-4">
                            {debts.map((debt) => (
                                <div key={debt.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-slate-50 p-4 rounded-xl border">
                                    <div className="lg:col-span-2">
                                        <label htmlFor={`name-${debt.id}`} className="text-sm font-semibold text-slate-600">Debt Name</label>
                                        <input type="text" id={`name-${debt.id}`} value={debt.name} onChange={e => handleNameChange(debt.id, e.target.value)} placeholder="e.g., Chase Sapphire" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor={`balance-${debt.id}`} className="text-sm font-semibold text-slate-600">Balance ($)</label>
                                        <input type="number" id={`balance-${debt.id}`} value={debt.balance} onChange={e => handleDebtChange(debt.id, 'balance', e.target.value)} placeholder="5000" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor={`apr-${debt.id}`} className="text-sm font-semibold text-slate-600">APR (%)</label>
                                        <input type="number" id={`apr-${debt.id}`} value={debt.apr} onChange={e => handleDebtChange(debt.id, 'apr', e.target.value)} placeholder="21.99" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <label htmlFor={`minpay-${debt.id}`} className="text-sm font-semibold text-slate-600">Min. Pmt ($)</label>
                                            <input type="number" id={`minpay-${debt.id}`} value={debt.minPaymentFlat} onChange={e => handleDebtChange(debt.id, 'minPaymentFlat', e.target.value)} placeholder="25" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                                        </div>
                                        <button onClick={() => removeDebt(debt.id)} className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-md"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <button onClick={addDebt} className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold px-4 py-2 rounded-lg transition-colors"><PlusCircle size={20} /> Add Debt</button>
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={handleCalculate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                            <Calculator /> Calculate My Debt-Free Date
                        </button>
                    </div>

                    <div ref={resultsRef}>
                        {results && <CalculatorResults results={results} customPayment={customPayment} setCustomPayment={setCustomPayment} />}
                    </div>
                </main>
                
                 <div className="mt-12 text-center text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
                    <strong>Affiliate Disclosure:</strong> This page contains affiliate links to Credit Karma. If you sign up through our links, we may earn a commission at no additional cost to you. This helps keep our tools 100% free. We only recommend services we believe provide genuine value. All opinions are our own.
                </div>

                <footer className="text-center mt-8 pt-8 border-t border-slate-200">
                    <p className="text-slate-500">Built by <a href="https://secretsantamatch.com" className="font-semibold text-indigo-600 hover:underline">SecretSantaMatch.com</a> to help you have a happier, debt-free holiday.</p>
                </footer>
            </div>
        </div>
    </>
    );
};

export default MinimumPaymentCalculator;
