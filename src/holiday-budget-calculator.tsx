import React, { useState, useMemo } from 'react';
// FIX: Import the 'BookOpen' icon from lucide-react.
import { Gift, Users, DollarSign, Percent, Lightbulb, User, Home, Sparkles, ShoppingBag, Truck, Heart, Info, BookOpen } from 'lucide-react';

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
  { id: 'coworkers', label: 'Coworkers', icon: User, people: 4, budget: 50 },
  { id: 'teachers', label: 'Teachers', icon: BookOpen, people: 2, budget: 50 },
];

const HolidayBudgetCalculator: React.FC = () => {
  const [totalBudget, setTotalBudget] = useState(1000);
  const [householdIncome, setHouseholdIncome] = useState(50000);
  const [familySize, setFamilySize] = useState(4);
  const [giftCategories, setGiftCategories] = useState<GiftCategory[]>(initialCategories);

  const recommendedBudget = useMemo(() => householdIncome * 0.015, [householdIncome]);
  const totalGiftSpending = useMemo(() => giftCategories.reduce((sum, cat) => sum + cat.budget, 0), [giftCategories]);

  const handleCategoryChange = (id: string, field: 'people' | 'budget', value: number) => {
    setGiftCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };
  
  const formatCurrency = (num: number, digits = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

  const GiftCategorySlider: React.FC<{ category: GiftCategory }> = ({ category }) => {
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
            onChange={(e) => handleCategoryChange(id, 'budget', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              id={`${id}-budget`}
              value={budget}
              onChange={(e) => handleCategoryChange(id, 'budget', parseInt(e.target.value))}
              className="w-28 pl-7 pr-2 py-2 border border-slate-300 rounded-md text-right font-semibold"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Affiliate Disclosure */}
      <div className="bg-slate-100 p-3 text-center text-sm text-slate-600 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0"/>
            <span>
                <strong>Affiliate Disclosure:</strong> We may earn a commission when you click links to financial products or services. This helps keep our tools free.
            </span>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif mb-2 flex items-center justify-center gap-3">
             <Sparkles className="w-8 h-8 text-amber-400" />
            Holiday Budget Calculator 2025
          </h1>
          <p className="text-lg text-slate-600">Plan your complete holiday spending with Santa's best financial advice.</p>
        </header>

        {/* Main Calculator Content */}
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-slate-200 space-y-10">
          {/* Your Holiday Budget Section */}
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

          {/* Gift Budget Breakdown Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Gift className="w-7 h-7 text-red-600"/>Gift Budget Breakdown</h2>
            <div className="space-y-8">
              {giftCategories.map(cat => <GiftCategorySlider key={cat.id} category={cat} />)}
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
      </main>

       <footer className="text-center py-8 mt-4 border-t text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} SecretSantaMatch.com - Making holidays easier.</p>
      </footer>
      
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #c62828;
          cursor: pointer;
          border-radius: 50%;
          margin-top: -6px; /* You need to specify a margin in Chrome, but not in Firefox */
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #c62828;
          cursor: pointer;
          border-radius: 50%;
          border: none;
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
