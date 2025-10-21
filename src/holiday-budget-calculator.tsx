import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Gift, Users, DollarSign, Lightbulb, User, Home, Sparkles, Info, BookOpen, Calendar, PiggyBank, CreditCard, ClipboardList, Banknote, ShieldCheck, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';

// Interfaces for our state
interface GiftCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  people: number;
  budget: number;
}

const initialCategories: GiftCategory[] = [
  { id: 'family', label: 'Family', icon: Home, people: 5, budget: 300 },
  { id: 'friends', label: 'Friends', icon: Users, people: 8, budget: 100 },
  { id: 'coworkers', label: 'Coworkers', icon: Briefcase, people: 4, budget: 50 },
  { id: 'teachers', label: 'Teachers', icon: BookOpen, people: 2, budget: 50 },
];

const formatCurrency = (num: number, digits = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

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
          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">{formatCurrency(perPerson, 2)} per person</span>
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
}

const CalculatorView: React.FC<CalculatorViewProps> = ({
    totalBudget, setTotalBudget,
    householdIncome, setHouseholdIncome,
    familySize, setFamilySize,
    recommendedBudget,
    giftCategories,
    handleCategoryChange,
    totalGiftSpending
}) => {
    return (
        <div className="space-y-10">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><DollarSign className="w-7 h-7 text-green-600"/>Your Holiday Budget</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label htmlFor="total-budget" className="font-semibold text-slate-600">Total Available Budget</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="total-budget" type="number" value={totalBudget} onChange={e => setTotalBudget(parseInt(e.target.value))} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="household-income" className="font-semibold text-slate-600">Household Income (Optional)</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input id="household-income" type="number" value={householdIncome} onChange={e => setHouseholdIncome(parseInt(e.target.value))} className="w-full pl-7 pr-2 py-2 border border-slate-300 rounded-md"/></div>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="family-size" className="font-semibold text-slate-600">Family Size</label>
                        <input id="family-size" type="number" value={familySize} onChange={e => setFamilySize(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                    </div>
                </div>
                {householdIncome > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
                        <strong>Recommended Budget:</strong> Based on a household income of {formatCurrency(householdIncome)}, financial experts suggest budgeting around <strong>{formatCurrency(recommendedBudget)}</strong> for holiday expenses (1.5% of annual income).
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
                    <span className="text-4xl font-bold text-red-600">{formatCurrency(totalGiftSpending)}</span>
                </div>
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 mt-1 flex-shrink-0"/>
                    <div><strong>Tip:</strong> Use <a href="https://secretsantamatch.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">SecretSantaMatch.com</a> for your group gift exchanges to set spending limits and make gift-giving easier!</div>
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
                <p className="text-slate-600">Here's how to save up for your <strong>{formatCurrency(totalGiftSpending)}</strong> gift budget by December 1st.</p>
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
                <strong>Warning:</strong> If you charge <strong>{formatCurrency(totalGiftSpending)}</strong> and only make minimum payments, it could take years to pay off and cost you hundreds in interest!
            </div>
        </div>
    );
};

interface SummaryViewProps {
  totalBudget: number;
  recommendedBudget: number;
  totalGiftSpending: number;
  giftCategories: GiftCategory[];
}

const SummaryView: React.FC<SummaryViewProps> = ({ totalBudget, recommendedBudget, totalGiftSpending, giftCategories }) => {
    const pieData = giftCategories.filter(c => c.budget > 0).map(c => ({ name: c.label, value: c.budget }));
    const COLORS = ['#e60049', '#0bb4ff', '#50e991', '#e6d800', '#9b19f5', '#ffa300'];
    const amountOverUnder = totalBudget - totalGiftSpending;
    return (
        <div className="space-y-8">
            <header className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3"><ClipboardList className="w-7 h-7 text-purple-600"/>Your Holiday Budget Summary</h2>
                <p className="text-slate-600">Here's your complete financial game plan for the holidays.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-sm font-bold uppercase text-slate-500">Total Budget</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-sm font-bold uppercase text-slate-500">Gift Spending</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalGiftSpending)}</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-sm font-bold uppercase text-slate-500">Remaining</p>
                    <p className={`text-2xl font-bold ${amountOverUnder >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{formatCurrency(amountOverUnder)}</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-sm font-bold uppercase text-slate-500">Recommended</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(recommendedBudget)}</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 text-center">Gift Spending Breakdown</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {pieData.map((entry: { name: string, value: number }, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};


const HolidayBudgetCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Calculator');
  const [totalBudget, setTotalBudget] = useState(1000);
  const [householdIncome, setHouseholdIncome] = useState(50000);
  const [familySize, setFamilySize] = useState(4);
  const [giftCategories, setGiftCategories] = useState<GiftCategory[]>(initialCategories);

  const recommendedBudget = useMemo(() => householdIncome * 0.015, [householdIncome]);
  const totalGiftSpending = useMemo(() => giftCategories.reduce((sum, cat) => sum + cat.budget, 0), [giftCategories]);

  const handleCategoryChange = (id: string, field: 'people' | 'budget', value: number) => {
    setGiftCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
        case 'Savings Plan':
            return <SavingsPlanView totalGiftSpending={totalGiftSpending} />;
        case 'Payment Strategy':
            return <PaymentStrategyView totalGiftSpending={totalGiftSpending} />;
        case 'Summary':
            return <SummaryView 
                      totalBudget={totalBudget} 
                      recommendedBudget={recommendedBudget}
                      totalGiftSpending={totalGiftSpending}
                      giftCategories={giftCategories}
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
            />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Affiliate Disclosure */}
      <div className="bg-slate-100 p-3 text-center text-sm text-slate-600 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0"/>
            <span>
                <strong>Affiliate Disclosure:</strong> We may earn a commission when you click links to financial products or services. This helps keep our tools free for everyone. Our recommendations are based on thorough research and are not influenced by advertising partnerships.
            </span>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-6">
          <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <Sparkles className="w-16 h-16 text-amber-400 flex-shrink-0" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Holiday Budget Calculator 2025</h1>
              <p className="text-lg text-slate-600 mt-1">Plan your complete holiday spending with Santa's best financial advice.</p>
            </div>
          </div>
        </header>
        
        <div className="relative">
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

        <div className="bg-white p-6 md:p-10 rounded-b-2xl rounded-tr-2xl shadow-lg border border-slate-200">
            {renderTabContent()}
        </div>
      </main>

       <footer className="text-center py-8 mt-4 border-t text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} SecretSantaMatch.com - Making holidays easier.</p>
      </footer>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@700&display=swap');
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #fff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          margin-top: -8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #fff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .font-serif {
            font-family: 'Playfair Display', serif;
        }
        .font-sans {
            font-family: 'Montserrat', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default HolidayBudgetCalculator;
