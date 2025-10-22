import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Gift, Users, DollarSign, Lightbulb, Home, Sparkles, Info, BookOpen, Calendar, PiggyBank, CreditCard, ClipboardList, Banknote, ShieldCheck, TrendingUp, TrendingDown, Briefcase, PartyPopper, Utensils, Plane, Heart, Package, Shirt, MoreHorizontal, AlertTriangle, ArrowRight, Download, Printer } from 'lucide-react';

// Interfaces for our state
interface GiftCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  people: number;
  budget: number;
}

const otherExpensesConfig = [
  { id: 'decorations', label: 'Decorations', icon: Sparkles },
  { id: 'food', label: 'Food & Entertaining', icon: Utensils },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'charitable', label: 'Charitable Giving', icon: Heart },
  { id: 'cards', label: 'Cards & Wrapping', icon: Package },
  { id: 'outfits', label: 'Holiday Outfits', icon: Shirt },
  { id: 'hosting', label: 'Party Hosting', icon: PartyPopper },
  { id: 'misc', label: 'Miscellaneous', icon: MoreHorizontal },
] as const;

type OtherExpenseKey = typeof otherExpensesConfig[number]['id'];

const initialCategories: GiftCategory[] = [
  { id: 'family', label: 'Family', icon: Home, people: 5, budget: 300 },
  { id: 'friends', label: 'Friends', icon: Users, people: 8, budget: 100 },
  { id: 'coworkers', label: 'Coworkers', icon: Briefcase, people: 4, budget: 50 },
  { id: 'teachers', label: 'Teachers', icon: BookOpen, people: 2, budget: 50 },
];

const formatCurrency = (num: number, digits = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

const AdSense: React.FC<{ slot: string }> = ({ slot }) => {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="my-8 flex justify-center bg-slate-100 p-4 rounded-lg">
      <ins className="adsbygoogle"
           style={{ display: 'inline-block', width: '336px', height: '280px' }}
           data-ad-client="ca-pub-3037944530219260"
           data-ad-slot={slot}></ins>
    </div>
  );
};

const Gauge: React.FC<{ value: number, label: string, color: string }> = ({ value, label, color }) => {
    const r = 55;
    const circ = 2 * Math.PI * r;
    const strokePct = value > 100 ? circ : (value / 100) * circ;
    return (
        <div className="text-center flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="15" />
                    <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="15" strokeDasharray={`${strokePct} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color }}>{value.toFixed(0)}%</div>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-600">{label}</div>
        </div>
    );
}

const GiftCategorySlider: React.FC<{ category: GiftCategory, totalBudget: number, onUpdate: (id: string, field: 'budget', value: number) => void }> = ({ category, totalBudget, onUpdate }) => {
    const { id, label, icon: Icon, people, budget } = category;
    const perPerson = people > 0 ? budget / people : 0;
    const maxBudget = totalBudget > 0 ? totalBudget : 1000;

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-slate-700">
          <label htmlFor={`${id}-people`} className="font-semibold flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-500" />
            {label} ({people} People)
          </label>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">{formatCurrency(perPerson)} per person</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            id={`${id}-slider`}
            min="0"
            max={maxBudget}
            step="10"
            value={budget}
            onChange={(e) => onUpdate(id, 'budget', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              id={`${id}-budget`}
              value={budget}
              onChange={(e) => onUpdate(id, 'budget', parseInt(e.target.value))}
              className="w-28 pl-7 pr-2 py-2 border border-slate-300 rounded-md text-right font-semibold"
            />
          </div>
        </div>
      </div>
    );
};

const ExpenseSlider: React.FC<{ label: string; icon: React.ElementType; value: number; onUpdate: (value: number) => void; max: number }> = ({ label, icon: Icon, value, onUpdate, max }) => {
    return (
        <div className="space-y-3">
             <label className="font-semibold text-slate-700 flex items-center gap-2">
                <Icon className="w-5 h-5 text-slate-500" />
                {label}
            </label>
            <div className="flex items-center gap-4">
                <input type="range" min="0" max={max} step="10" value={value} onChange={e => onUpdate(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" value={value} onChange={e => onUpdate(parseInt(e.target.value))} className="w-28 pl-7 pr-2 py-2 border border-slate-300 rounded-md text-right font-semibold" />
                </div>
            </div>
        </div>
    );
};

const handleCKClick = () => {
    if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'click', { 'event_category': 'affiliate', 'event_label': 'Credit Karma Banner - Holiday Budget' });
    }
};

const CreditKarmaCTA: React.FC<{text: string}> = ({ text }) => (
    <div className="mt-8 p-4 bg-blue-50 border-t-4 border-blue-500 rounded-b-lg">
        <h3 className="font-bold text-blue-800 mb-2">Supercharge Your Finances</h3>
        <p className="text-blue-700 mb-4 text-sm">{text}</p>
        <a rel="sponsored" href="https://www.awin1.com/cread.php?s=3597062&v=66532&q=475589&r=2612068" target="_blank" onClick={handleCKClick} className="block bg-blue-600 text-white rounded-lg p-3 no-underline hover:bg-blue-700 transition-colors text-center">
            <div className="font-bold">Check Your Score Free on Credit Karma</div>
            <div className="text-xs opacity-80">Won't affect your score</div>
        </a>
    </div>
);

interface CalculatorViewProps {
    totalBudget: number;
    setTotalBudget: (value: number) => void;
    householdIncome: number;
    setHouseholdIncome: (value: number) => void;
    familySize: number;
    setFamilySize: (value: number) => void;
    recommendedBudget: number;
    giftCategories: GiftCategory[];
    handleCategoryChange: (id: string, field: 'budget', value: number) => void;
    totalGiftSpending: number;
    otherExpenses: Record<OtherExpenseKey, number>;
    handleOtherExpenseChange: (key: OtherExpenseKey, value: number) => void;
    plannedSpending: number;
    amountOverUnder: number;
    pieData: { name: string; value: number }[];
    setActiveTab: (tab: string) => void;
    creditLimit: number;
    setCreditLimit: (value: number) => void;
    currentBalance: number;
    setCurrentBalance: (value: number) => void;
}

const CalculatorView: React.FC<CalculatorViewProps> = ({
    totalBudget, setTotalBudget,
    householdIncome, setHouseholdIncome,
    familySize, setFamilySize,
    recommendedBudget,
    giftCategories,
    handleCategoryChange,
    totalGiftSpending,
    otherExpenses,
    handleOtherExpenseChange,
    plannedSpending,
    amountOverUnder,
    pieData,
    setActiveTab,
    creditLimit, setCreditLimit,
    currentBalance, setCurrentBalance
}) => {
    const COLORS = ['#e60049', '#0bb4ff', '#50e991', '#e6d800', '#9b19f5', '#ffa300', '#dc2626', '#16a34a', '#fbbf24', '#4f46e5', '#db2777', '#f59e0b'];
    const budgetUsagePercentage = totalBudget > 0 ? (plannedSpending / totalBudget) * 100 : 0;
    const isOverBudget = plannedSpending > totalBudget;

    const creditHealth = useMemo(() => {
        if (creditLimit <= 0) return null;
        const currentUtil = (currentBalance / creditLimit) * 100;
        const newBalance = currentBalance + plannedSpending;
        const newUtil = (newBalance / creditLimit) * 100;
        let scoreImpact = 0;
        if (newUtil > 70) scoreImpact = -80;
        else if (newUtil > 50) scoreImpact = -50;
        else if (newUtil > 30) scoreImpact = -20;

        const getUtilColor = (util: number) => util > 70 ? '#ef4444' : util > 50 ? '#f59e0b' : '#10b981';

        return { currentUtil, newUtil, scoreImpact, newUtilColor: getUtilColor(newUtil) };
    }, [creditLimit, currentBalance, plannedSpending]);
    
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><DollarSign className="w-7 h-7 text-green-600"/>Your Holiday Budget</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="total-budget" className="font-semibold text-slate-600 block mb-1 min-h-[40px]">Total Available Budget</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="total-budget" type="number" value={totalBudget} onChange={e => setTotalBudget(parseInt(e.target.value) || 0)} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                     <div>
                        <label htmlFor="household-income" className="font-semibold text-slate-600 block mb-1 min-h-[40px]">Household Income (Optional)</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="household-income" type="number" value={householdIncome} onChange={e => setHouseholdIncome(parseInt(e.target.value) || 0)} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                     <div>
                        <label htmlFor="family-size" className="font-semibold text-slate-600 block mb-1 min-h-[40px]">Family Size</label>
                        <input id="family-size" type="number" value={familySize} onChange={e => setFamilySize(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                    </div>
                </div>
                {householdIncome > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
                        <strong>Recommended Budget:</strong> Based on a household income of {formatCurrency(householdIncome, 0)}, financial experts suggest budgeting around <strong>{formatCurrency(recommendedBudget, 0)}</strong> for holiday expenses (1.5% of annual income).
                    </div>
                )}
            </section>
            
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Gift className="w-7 h-7 text-red-600"/>Gift Budget Breakdown</h2>
                <div className="space-y-8">
                    {giftCategories.map(cat => <GiftCategorySlider key={cat.id} category={cat} totalBudget={totalBudget} onUpdate={handleCategoryChange} />)}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-dashed flex justify-end items-center gap-4">
                    <span className="text-xl font-semibold">Total Gifts:</span>
                    <span className="text-4xl font-bold text-red-600">{formatCurrency(totalGiftSpending, 2)}</span>
                </div>
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 mt-1 flex-shrink-0"/>
                    <div><strong>Tip:</strong> Use <a href="https://secretsantamatch.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">SecretSantaMatch.com</a> for your group gift exchanges to set spending limits and make gift-giving easier!</div>
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><PartyPopper className="w-7 h-7 text-purple-600"/>Other Holiday Expenses</h2>
                <div className="space-y-8">
                   {otherExpensesConfig.map(expense => (
                        <ExpenseSlider 
                            key={expense.id}
                            label={expense.label}
                            icon={expense.icon}
                            value={otherExpenses[expense.id]}
                            onUpdate={(value) => handleOtherExpenseChange(expense.id, value)}
                            max={totalBudget > 0 ? totalBudget : 2000}
                        />
                   ))}
                </div>
            </section>
            
            <AdSense slot="1234567890" />
            
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-blue-600"/>Credit Health Check</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="credit-limit" className="font-semibold text-slate-600 block mb-1">Total Credit Limits (All Cards)</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="credit-limit" type="number" value={creditLimit} onChange={e => setCreditLimit(parseInt(e.target.value) || 0)} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                     <div>
                        <label htmlFor="current-balance" className="font-semibold text-slate-600 block mb-1">Current Card Balances</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="current-balance" type="number" value={currentBalance} onChange={e => setCurrentBalance(parseInt(e.target.value) || 0)} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                </div>
                {creditHealth ? (
                    <div className="bg-slate-50 p-6 rounded-xl border">
                        <h3 className="font-bold text-center text-lg mb-4">Credit Utilization Impact</h3>
                        <div className="flex justify-around items-center">
                            <Gauge value={creditHealth.currentUtil} label="Current" color="#10b981" />
                            <ArrowRight className="w-8 h-8 text-slate-400" />
                            <Gauge value={creditHealth.newUtil} label="After Holiday Spend" color={creditHealth.newUtilColor} />
                        </div>
                        {creditHealth.scoreImpact < 0 ? (
                             <div className="mt-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0"/>
                                <div><strong>CRITICAL:</strong> Your spending will push utilization to {creditHealth.newUtil.toFixed(0)}%. This could drop your credit score by up to <strong>{Math.abs(creditHealth.scoreImpact)} points.</strong></div>
                            </div>
                        ) : (
                             <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                                <strong>Good job!</strong> Your holiday spending should keep your utilization in a healthy range with minimal impact to your score.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                        Enter your credit limit and balance to see your score impact.
                    </div>
                )}
                 <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">Don't Know These Numbers?</h3>
                    <p className="text-blue-700 mb-4 text-sm">Credit Karma shows all your cards, calculates utilization for you, and monitors your score for free. It takes 3 minutes to sign up and won't hurt your score.</p>
                    <a rel="sponsored" href="https://www.awin1.com/cread.php?s=3597062&v=66532&q=475589&r=2612068" target="_blank" onClick={handleCKClick} className="block bg-blue-600 text-white rounded-lg p-4 no-underline hover:bg-blue-700 transition-colors">
                        <div className="flex justify-between items-center">
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase opacity-80">INTUIT</div>
                                <div className="text-xl font-extrabold">creditkarma</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">Check Your Score Free</div>
                                <div className="text-sm opacity-80">Won't affect your score</div>
                            </div>
                        </div>
                    </a>
                </div>
            </section>

            <AdSense slot="0987654321" />

            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><ClipboardList className="w-7 h-7 text-indigo-600"/>Budget Summary</h2>
                 <div className="space-y-4 max-w-lg mx-auto text-lg">
                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Available Budget:</span><span>{formatCurrency(totalBudget, 2)}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Planned Spending:</span><span className="text-red-600">{formatCurrency(plannedSpending, 2)}</span></div>
                    <div className="flex justify-between font-bold text-xl border-t pt-3"><span className="text-slate-800">Remaining:</span><span className={amountOverUnder >= 0 ? 'text-green-600' : 'text-orange-600'}>{formatCurrency(amountOverUnder, 2)}</span></div>
                </div>
                {isOverBudget && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg text-center font-semibold">
                        <Info className="w-5 h-5 inline-block mr-2"/> Over Budget
                    </div>
                )}
                <div className="mt-6 space-y-2">
                    <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                            className={`h-4 rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                        ></div>
                         {budgetUsagePercentage > 100 && (
                             <div className="absolute top-0 h-4 bg-red-500" style={{ left: '100%', width: `${budgetUsagePercentage - 100}%`}}></div>
                         )}
                    </div>
                    <div className="text-center text-sm font-semibold text-slate-500">{budgetUsagePercentage.toFixed(1)}% of budget used</div>
                </div>

                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-center">Budget Allocation</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false} labelLine={false}>
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <button onClick={() => setActiveTab('Savings Plan')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 text-lg rounded-full shadow-md transition-transform transform hover:scale-105">
                        Create Savings Plan
                    </button>
                </div>
            </section>
        </div>
    );
};

const SavingsPlanView: React.FC<{totalGiftSpending: number}> = ({ totalGiftSpending }) => {
    const targetDate = new Date('2025-12-01');
    const today = new Date();
    
    const daysLeft = Math.max(1, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksLeft = Math.max(1, Math.floor(daysLeft / 7));
    const monthsLeft = Math.max(1, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));

    const weeklySaving = totalGiftSpending > 0 ? totalGiftSpending / weeksLeft : 0;
    const monthlySaving = totalGiftSpending > 0 ? totalGiftSpending / monthsLeft : 0;

    return (
        <div className="space-y-8">
            <header className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3"><PiggyBank className="w-7 h-7 text-pink-600"/>Your Holiday Savings Plan</h2>
                <p className="text-slate-600">Here's how to save up for your <strong>{formatCurrency(totalGiftSpending, 2)}</strong> gift budget by December 1st.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center">
                    <p className="text-sm font-bold uppercase text-slate-500">Save Weekly</p>
                    <p className="text-5xl font-bold text-slate-800 my-2">{formatCurrency(weeklySaving, 2)}</p>
                    <p className="text-slate-500">for {weeksLeft} weeks</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center">
                    <p className="text-sm font-bold uppercase text-slate-500">Save Monthly</p>
                    <p className="text-5xl font-bold text-slate-800 my-2">{formatCurrency(monthlySaving, 2)}</p>
                    <p className="text-slate-500">for {monthsLeft} months</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 text-center">Smart Savings Tips</h3>
                <ul className="space-y-3 max-w-lg mx-auto">
                    <li className="flex items-start gap-3"><TrendingUp className="w-5 h-5 mt-1 text-green-500 flex-shrink-0"/><span><strong>Automate it:</strong> Set up an automatic weekly or monthly transfer to a separate savings account.</span></li>
                    <li className="flex items-start gap-3"><DollarSign className="w-5 h-5 mt-1 text-green-500 flex-shrink-0"/><span><strong>Round Up:</strong> Use an app that rounds up your purchases to the nearest dollar and saves the change.</span></li>
                    <li className="flex items-start gap-3"><Calendar className="w-5 h-5 mt-1 text-green-500 flex-shrink-0"/><span><strong>Cash Windfalls:</strong> Dedicate any unexpected money (like a bonus or a small windfall) directly to your holiday fund.</span></li>
                </ul>
            </div>
            <CreditKarmaCTA text="Credit Karma can help you find savings on loans and cards, freeing up more cash for your holiday goals." />
        </div>
    );
};

const PaymentStrategyView: React.FC<{totalGiftSpending: number}> = ({ totalGiftSpending }) => {
    return (
        <div className="space-y-8">
            <header className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3"><CreditCard className="w-7 h-7 text-blue-600"/>Holiday Payment Strategy</h2>
                <p className="text-slate-600">How you pay matters. Choose the right strategy to avoid debt and maximize rewards.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><Banknote className="w-6 h-6 text-green-600"/>Pay with Cash/Debit</h3>
                    <p className="text-sm text-slate-600 mb-4">The safest way to stick to your budget.</p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 mt-1 text-green-500 flex-shrink-0"/><span><strong>Pro:</strong> Impossible to overspend. Zero risk of interest or debt.</span></li>
                        <li className="flex items-start gap-2"><TrendingDown className="w-4 h-4 mt-1 text-red-500 flex-shrink-0"/><span><strong>Con:</strong> No rewards or purchase protection. Fraud can be harder to resolve.</span></li>
                    </ul>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><CreditCard className="w-6 h-6 text-blue-600"/>Pay with Credit Card</h3>
                    <p className="text-sm text-slate-600 mb-4">Great for rewards, but requires discipline.</p>
                     <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 mt-1 text-green-500 flex-shrink-0"/><span><strong>Pro:</strong> Earn cash back/points. Excellent fraud and purchase protection.</span></li>
                        <li className="flex items-start gap-2"><TrendingDown className="w-4 h-4 mt-1 text-red-500 flex-shrink-0"/><span><strong>Con:</strong> Easy to overspend. High interest if you don't pay in full.</span></li>
                    </ul>
                </div>
            </div>
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <strong>Warning:</strong> If you charge <strong>{formatCurrency(totalGiftSpending, 2)}</strong> and only make minimum payments, it could take years to pay off and cost you hundreds in interest!
            </div>
            <CreditKarmaCTA text="Choosing the right card matters. Check your credit score and see your best card options for free with Credit Karma." />
        </div>
    );
};

interface SummaryViewProps {
  totalBudget: number;
  plannedSpending: number;
  pieData: { name: string; value: number }[];
  onDownloadClick: () => void;
  recommendedBudget: number;
}

const SummaryView: React.FC<SummaryViewProps> = ({ totalBudget, plannedSpending, pieData, onDownloadClick, recommendedBudget }) => {
    const amountOverUnder = totalBudget - plannedSpending;
    const COLORS = ['#e60049', '#0bb4ff', '#50e991', '#e6d800', '#9b19f5', '#ffa300', '#dc2626', '#16a34a', '#fbbf24', '#4f46e5', '#db2777', '#f59e0b'];
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
        if (value === 0) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>
            {formatCurrency(value, 0)}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <header className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3"><ClipboardList className="w-7 h-7 text-purple-600"/>Your Holiday Budget Summary</h2>
                <p className="text-slate-600">Here's your complete financial game plan for the holidays.</p>
            </header>

             <div className="space-y-4 max-w-lg mx-auto text-lg">
                <div className="flex justify-between font-semibold"><span className="text-slate-600">Available Budget:</span><span>{formatCurrency(totalBudget, 2)}</span></div>
                {/* FIX: Add recommendedBudget to the summary view */}
                {recommendedBudget > 0 && (
                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Recommended Budget:</span><span>{formatCurrency(recommendedBudget, 2)}</span></div>
                )}
                <div className="flex justify-between font-semibold"><span className="text-slate-600">Planned Spending:</span><span className="text-red-600">{formatCurrency(plannedSpending, 2)}</span></div>
                <div className="flex justify-between font-bold text-xl border-t pt-3"><span className="text-slate-800">Remaining:</span><span className={amountOverUnder >= 0 ? 'text-green-600' : 'text-orange-600'}>{formatCurrency(amountOverUnder, 2)}</span></div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 text-center">Budget Allocation</h3>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="40%" outerRadius={100} labelLine={false} label={renderCustomizedLabel}>
                                {pieData.map((_entry, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
                            <Legend wrapperStyle={{ bottom: 0, left: 0, right: 0 }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="text-center">
                <button onClick={onDownloadClick} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 text-lg rounded-full shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 mx-auto">
                    <Download className="w-5 h-5"/>
                    Download Your Budget Plan
                </button>
            </div>
            <CreditKarmaCTA text="Your budget is set! Now, track your credit score for free as you shop to see your progress in real-time." />
        </div>
    );
};


const HolidayBudgetCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Calculator');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [totalBudget, setTotalBudget] = useState(1000);
  const [householdIncome, setHouseholdIncome] = useState(50000);
  const [familySize, setFamilySize] = useState(4);
  const [giftCategories, setGiftCategories] = useState<GiftCategory[]>(initialCategories);
  const [otherExpenses, setOtherExpenses] = useState<Record<OtherExpenseKey, number>>({
      decorations: 100,
      food: 200,
      travel: 150,
      charitable: 50,
      cards: 50,
      outfits: 100,
      hosting: 150,
      misc: 100,
  });
  const [creditLimit, setCreditLimit] = useState(10000);
  const [currentBalance, setCurrentBalance] = useState(2000);

  const recommendedBudget = useMemo(() => householdIncome * 0.015, [householdIncome]);
  const totalGiftSpending = useMemo(() => giftCategories.reduce((sum, cat) => sum + cat.budget, 0), [giftCategories]);
  const totalOtherSpending = useMemo(() => Object.values(otherExpenses).reduce((s, v) => s + v, 0), [otherExpenses]);
  const plannedSpending = useMemo(() => totalGiftSpending + totalOtherSpending, [totalGiftSpending, totalOtherSpending]);

  const pieData = useMemo(() => {
    const giftData = giftCategories.filter(c => c.budget > 0).map(c => ({ name: c.label, value: c.budget }));
    const otherData = otherExpensesConfig
        .filter(o => otherExpenses[o.id] > 0)
        .map(o => ({ name: o.label, value: otherExpenses[o.id] }));
    return [...giftData, ...otherData];
  }, [giftCategories, otherExpenses]);

  const handleCategoryChange = (id: string, field: 'budget', value: number) => {
    setGiftCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };
  
  const handleOtherExpenseChange = (key: OtherExpenseKey, value: number) => {
      setOtherExpenses(prev => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    window.print();
    setIsDownloadModalOpen(false);
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
        case 'Savings Plan':
            return <SavingsPlanView totalGiftSpending={plannedSpending} />;
        case 'Payment Strategy':
            return <PaymentStrategyView totalGiftSpending={plannedSpending} />;
        case 'Summary':
            return <SummaryView 
                      totalBudget={totalBudget} 
                      recommendedBudget={recommendedBudget}
                      plannedSpending={plannedSpending}
                      pieData={pieData}
                      onDownloadClick={() => setIsDownloadModalOpen(true)}
                    />;
        case 'Calculator':
        default:
            return <CalculatorView
                totalBudget={totalBudget} setTotalBudget={setTotalBudget}
                householdIncome={householdIncome} setHouseholdIncome={setHouseholdIncome}
                familySize={familySize} setFamilySize={setFamilySize}
                recommendedBudget={recommendedBudget}
                giftCategories={giftCategories}
                handleCategoryChange={handleCategoryChange}
                totalGiftSpending={totalGiftSpending}
                otherExpenses={otherExpenses}
                handleOtherExpenseChange={handleOtherExpenseChange}
                plannedSpending={plannedSpending}
                amountOverUnder={totalBudget - plannedSpending}
                pieData={pieData}
                setActiveTab={setActiveTab}
                creditLimit={creditLimit} setCreditLimit={setCreditLimit}
                currentBalance={currentBalance} setCurrentBalance={setCurrentBalance}
            />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="no-print bg-slate-100 p-3 text-center text-sm text-slate-600 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0"/>
            <span>
                <strong>Affiliate Disclosure:</strong> We may earn a commission when you click links. This helps keep our tools free. Our recommendations are based on thorough research.
            </span>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="no-print flex justify-between items-center mb-4 text-sm">
            <a href="/" className="font-bold text-slate-700 hover:text-red-600 transition-colors">← SecretSantaMatch.com</a>
            <a href="/blog.html" className="font-semibold text-slate-500 hover:text-red-600 transition-colors">Visit the Blog →</a>
        </div>
        <header className="no-print mb-6">
          <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <Sparkles className="w-16 h-16 text-amber-400 flex-shrink-0" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Holiday Budget Calculator 2025</h1>
              <p className="text-lg text-slate-600 mt-1">Plan your complete holiday spending with Santa's best financial advice.</p>
            </div>
          </div>
        </header>
        
        <div className="no-print relative">
            <div className="bg-white rounded-t-xl p-2 inline-block">
                <div className="flex border-b border-slate-200">
                    {['Calculator', 'Savings Plan', 'Payment Strategy', 'Summary'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-3 md:px-6 font-semibold text-sm md:text-base focus:outline-none transition-colors duration-200 rounded-t-lg ${
                                activeTab === tab
                                    ? 'bg-white border-slate-200 border-t border-l border-r -mb-px text-red-600'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="printable-area bg-white p-6 md:p-10 rounded-b-2xl rounded-tr-2xl shadow-lg border border-slate-200">
            {renderTabContent()}
        </div>
      </main>

       <footer className="no-print text-center py-8 mt-4 border-t text-slate-500 text-sm">
        <div className="max-w-4xl mx-auto px-4">
            <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-center text-slate-600 mb-3">Related Financial Tools</h3>
                <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
                    <a href="/minimum-payment-calculator.html" className="font-semibold text-blue-600 hover:underline">Minimum Payment Calculator</a>
                    <a href="/credit-card-vs-debit-card.html" className="font-semibold text-blue-600 hover:underline">Credit vs. Debit Card Guide</a>
                </div>
            </div>
            <div className="mt-6 text-xs text-slate-400 max-w-2xl mx-auto text-left">
                <p><strong>Disclaimer:</strong> This calculator is for informational and illustrative purposes only and does not constitute financial advice. The results are estimates based on the data you provide and are not a guarantee of actual outcomes. Please consult with a qualified financial professional before making any financial decisions.</p>
            </div>
            <p className="mt-6">&copy; {new Date().getFullYear()} SecretSantaMatch.com - Making holidays easier.</p>
        </div>
      </footer>

      {isDownloadModalOpen && (
          <div className="no-print fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsDownloadModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center" onClick={e => e.stopPropagation()}>
                  <Printer className="w-16 h-16 mx-auto text-indigo-500" />
                  <h2 className="text-2xl font-bold mt-4 mb-2">Download Your Budget Plan</h2>
                  <p className="text-slate-600 mb-6">This will prepare a print-friendly version of your summary. In your browser's print dialog, you can choose to "Save as PDF" or send it to a printer.</p>
                  <div className="p-4 bg-slate-50 rounded-lg mb-6 text-left text-sm text-slate-500">
                      <h3 className="font-bold text-slate-700 mb-2">While you're here, check out our other free tools:</h3>
                      <ul className="list-disc list-inside space-y-1">
                          <li><a href="/" className="text-blue-600 font-semibold hover:underline">Free Secret Santa Generator</a></li>
                          <li><a href="/minimum-payment-calculator.html" className="text-blue-600 font-semibold hover:underline">Debt Payoff Calculator</a></li>
                      </ul>
                  </div>
                  <div className="flex justify-center gap-4">
                      <button onClick={() => setIsDownloadModalOpen(false)} className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors">Cancel</button>
                      <button onClick={handlePrint} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">Download Now</button>
                  </div>
              </div>
          </div>
      )}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@700&display=swap');
        
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; background: #fff; border: 3px solid #3b82f6; cursor: pointer; border-radius: 50%; margin-top: -8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input[type="range"]::-moz-range-thumb { width: 24px; height: 24px; background: #fff; border: 3px solid #3b82f6; cursor: pointer; border-radius: 50%; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
        .recharts-legend-item-text { color: #475569 !important; }
        .recharts-text.recharts-label { font-size: 14px; }
        
        @media print {
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; border: none; box-shadow: none; }
            .no-print, .no-print * { display: none !important; }
            .recharts-wrapper { margin: 0 auto; }
        }
      `}</style>
    </div>
  );
};

export default HolidayBudgetCalculator;
