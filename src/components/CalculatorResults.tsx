import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Trash2, PlusCircle, Banknote, Coffee, Utensils, Tv, Phone, Pizza, TreePalm } from 'lucide-react';
import CalculatorResults from './components/CalculatorResults';

// Dummy modals since the components are not provided but are used by CalculatorResults
const ShareModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 text-white p-8 rounded-2xl max-w-lg w-full text-center">
            <h2 className="text-3xl font-bold mb-4">Share this Tool!</h2>
            <p className="mb-6">Help others understand their debt by sharing this free calculator.</p>
            <div className="flex justify-center gap-4">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 p-3 rounded-full">Facebook</a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Check out this debt calculator!")}`} target="_blank" rel="noopener noreferrer" className="bg-sky-500 p-3 rounded-full">Twitter</a>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this debt calculator: " + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 p-3 rounded-full">WhatsApp</a>
            </div>
            <button onClick={onClose} className="mt-8 bg-gray-600 px-6 py-2 rounded-lg">Close</button>
        </div>
    </div>
);

const BlogModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 text-white p-8 rounded-2xl max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-4">Debt Freedom Guide</h2>
            <p className="mb-4">This is a placeholder for the full blog post content. You'd find detailed strategies here on how to tackle debt, from budgeting tips to advanced payoff methods like the Avalanche and Snowball techniques.</p>
            <p>Check back later for the full guide!</p>
            <button onClick={onClose} className="mt-8 bg-gray-600 px-6 py-2 rounded-lg">Close</button>
        </div>
    </div>
);

// Interfaces
interface Debt {
  id: number;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

// Main Component
const MinimumPaymentCalculator: React.FC = () => {
    const [debts, setDebts] = useState<Debt[]>([
        { id: 1, name: 'Credit Card 1', balance: 5000, apr: 21.99, minPayment: 150 },
        { id: 2, name: 'Personal Loan', balance: 10000, apr: 9.5, minPayment: 250 },
    ]);
    const [results, setResults] = useState<any | null>(null);
    const [customPayment, setCustomPayment] = useState(100);
    const [showBlogModal, setShowBlogModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    const addDebt = () => {
        setDebts([...debts, { id: Date.now(), name: `New Debt ${debts.length + 1}`, balance: 0, apr: 0, minPayment: 0 }]);
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

    const handleCalculate = () => {
        const calculatePayoff = (extraPayment: number) => {
            let localDebts: Debt[] = JSON.parse(JSON.stringify(debts.filter(d => d.balance > 0)));
            let months = 0;
            let totalInterest = 0;
            const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
            const totalPayment = totalMinPayment + extraPayment;
            
            while (localDebts.reduce((sum, d) => sum + d.balance, 0) > 0) {
                months++;
                if (months > 1200) { // Safety break for 100 years
                    return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
                }

                let monthlyInterest = 0;
                localDebts.forEach(debt => {
                    const interest = debt.balance * (debt.apr / 100 / 12);
                    monthlyInterest += interest;
                    debt.balance += interest;
                });
                totalInterest += monthlyInterest;

                let paymentRemaining = totalPayment;
                
                // Pay minimums first
                const tempDebts: Debt[] = [];
                for (const debt of localDebts) {
                    const payment = Math.min(debt.balance, debt.minPayment);
                    debt.balance -= payment;
                    paymentRemaining -= payment;
                    if (debt.balance > 0.01) {
                      tempDebts.push(debt);
                    }
                }
                localDebts = tempDebts;


                // Avalanche method for extra payment
                localDebts.sort((a, b) => b.apr - a.apr);

                const nextTempDebts: Debt[] = [];
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
            const totalPrincipal = debts.reduce((sum, d) => sum + d.balance, 0);
            return { months, totalInterest, totalPaid: totalPrincipal + totalInterest };
        };

        const minPayResults = calculatePayoff(0);
        const customResults = calculatePayoff(customPayment);
        
        const totalPrincipal = debts.reduce((sum, d) => sum + d.balance, 0);
        const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
        
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
            { label: 'Cancel Subscriptions', amount: 50, description: "Review and cancel unused streaming services, apps, or gym memberships.", icon: Tv },
            { label: 'Brew Coffee at Home', amount: 100, description: "Skip the daily coffee shop run. A $5 coffee daily costs $150/month!", icon: Coffee },
            { label: 'Pack Your Lunch', amount: 200, description: "Bringing lunch to work instead of buying it can save a surprising amount.", icon: Utensils },
            { label: 'Eat Out Less', amount: 150, description: "Reduce restaurant meals and takeout. One less dinner out a week makes a big difference.", icon: Pizza },
            { label: 'Use a Smart Thermostat', amount: 20, description: "Optimize your heating and cooling to save on your energy bill.", icon: TreePalm },
            { label: 'Switch Phone Plans', amount: 40, description: "Compare carriers and switch to a cheaper plan that still meets your needs.", icon: Phone },
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
                { name: `Interest with Min. Payments`, value: minPayResults.totalInterest, fill: '#dc2626' },
            ],
            moneySavingTips
        });
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-3">Minimum Payment TRAP Calculator</h1>
                    <p className="text-xl text-gray-400">See how much money you're throwing away by only paying the minimum.</p>
                </header>

                <main className="space-y-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Banknote className="w-8 h-8 text-green-400" /> Enter Your Debts</h2>
                        <div id="debt-list" className="space-y-4">
                            {debts.map((debt) => (
                                <div key={debt.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-white/5 p-4 rounded-xl">
                                    <input type="text" value={debt.name} onChange={e => handleNameChange(debt.id, e.target.value)} placeholder="Debt Name (e.g., Chase Sapphire)" className="md:col-span-2 bg-transparent border-b-2 border-white/30 p-2 focus:outline-none focus:border-yellow-400" />
                                    <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span><input type="number" value={debt.balance} onChange={e => handleDebtChange(debt.id, 'balance', e.target.value)} placeholder="Balance" className="w-full bg-transparent border-b-2 border-white/30 p-2 pl-6 focus:outline-none focus:border-yellow-400" /></div>
                                    <div className="relative"><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">%</span><input type="number" value={debt.apr} onChange={e => handleDebtChange(debt.id, 'apr', e.target.value)} placeholder="APR" className="w-full bg-transparent border-b-2 border-white/30 p-2 pr-6 focus:outline-none focus:border-yellow-400" /></div>
                                    <div className="flex items-center gap-2">
                                    <div className="relative flex-grow"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span><input type="number" value={debt.minPayment} onChange={e => handleDebtChange(debt.id, 'minPayment', e.target.value)} placeholder="Min. Payment" className="w-full bg-transparent border-b-2 border-white/30 p-2 pl-6 focus:outline-none focus:border-yellow-400" /></div>
                                        <button onClick={() => removeDebt(debt.id)} className="text-red-400 hover:text-red-300"><Trash2 /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex gap-4">
                            <button onClick={addDebt} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 font-semibold px-4 py-2 rounded-lg transition-colors"><PlusCircle size={20} /> Add Debt</button>
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={handleCalculate} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-black text-2xl px-12 py-5 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                            Calculate My Freedom Date!
                        </button>
                    </div>

                    <div ref={resultsRef}>
                        {results && <CalculatorResults results={results} customPayment={customPayment} setCustomPayment={setCustomPayment} setShowBlogModal={setShowBlogModal} setShowShareModal={setShowShareModal} />}
                    </div>
                </main>
                {showBlogModal && <BlogModal onClose={() => setShowBlogModal(false)} />}
                {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}

                <footer className="text-center mt-12 pt-8 border-t border-white/20">
                    <p className="text-gray-500">Built by <a href="https://secretsantamatch.com" className="underline hover:text-gray-300">SecretSantaMatch.com</a> to help you have a happier, debt-free holiday.</p>
                </footer>
                 <style>{`
                    .slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 32px;
                        height: 32px;
                        background: #facc15;
                        cursor: pointer;
                        border-radius: 50%;
                        border: 4px solid #1f2937;
                    }
                    .slider::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        background: #facc15;
                        cursor: pointer;
                        border-radius: 50%;
                        border: 4px solid #1f2937;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default MinimumPaymentCalculator;
