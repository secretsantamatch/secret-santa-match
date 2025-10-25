import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
// FIX: Import missing icons 'Smartphone', 'PiggyBank', and 'Heart' from lucide-react.
import { DollarSign, TrendingDown, TrendingUp, Lightbulb, Plus, Trash2, X, BookOpen, Share2, Facebook, Twitter, Mail, Flame, Smartphone, PiggyBank, Heart } from 'lucide-react';

// Lazy load the results component
const CalculatorResults = lazy(() => import('./components/CalculatorResults'));

// Define a strict type for the account to improve type safety
interface Account {
  id: number;
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
}

const MinimumPaymentCalculator: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: 'Credit Card 1', balance: '5000', apr: '19.99', minPayment: '100' }
  ]);
  const [showResults, setShowResults] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [customPayment, setCustomPayment] = useState(0);

  // Effect to run AdSense push after component mounts and results are shown
  useEffect(() => {
    if (showResults) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [showResults]);

  const addAccount = () => {
    // Ensure there's at least one account to get a max ID from
    const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    setAccounts([...accounts, { 
      id: newId, 
      name: `Credit Card ${newId}`, 
      balance: '', 
      apr: '', 
      minPayment: '' 
    }]);
  };

  const removeAccount = (id: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };
  
  const updateAccount = (id: number, field: keyof Omit<Account, 'id'>, value: string) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const calculatePayoff = (monthlyPayment: number, principal: number, annualRate: number) => {
    const monthlyRate = annualRate / 100 / 12;
    let currentBalance = principal;
    let totalInterest = 0;
    let months = 0;
    const maxMonths = 600; // 50 years sanity check

    if (principal <= 0) {
      return { months: 0, totalPaid: 0, totalInterest: 0 };
    }
    
    // If interest rate is 0, calculation is simple
    if (annualRate === 0 || monthlyRate === 0) {
        if (monthlyPayment <= 0) return { months: Infinity, totalPaid: Infinity, totalInterest: 0 };
        const payoffMonths = Math.ceil(principal / monthlyPayment);
        return { months: payoffMonths, totalPaid: principal, totalInterest: 0 };
    }
    
    // If payment doesn't cover interest, it will never be paid off
    if (monthlyPayment <= principal * monthlyRate) {
      return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity };
    }

    while (currentBalance > 0 && months < maxMonths) {
      const interestCharge = currentBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestCharge;
      
      totalInterest += interestCharge;
      currentBalance -= principalPayment;
      months++;
    }

    return { 
        months: months >= maxMonths ? Infinity : months, 
        totalPaid: principal + totalInterest, 
        totalInterest,
    };
  };

  const results = useMemo(() => {
    const validAccounts = accounts.filter(a => 
      parseFloat(a.balance) > 0 && 
      parseFloat(a.minPayment) > 0
    );

    if (validAccounts.length === 0) return null;

    const totalBalance = validAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const totalMinPayment = validAccounts.reduce((sum, a) => sum + parseFloat(a.minPayment), 0);
    
    const weightedAPR = totalBalance > 0 ? validAccounts.reduce((sum, a) => {
      return sum + (parseFloat(a.apr || '0') * parseFloat(a.balance));
    }, 0) / totalBalance : 0;

    const accountResults = validAccounts.map(a => ({
      ...a,
      balanceNum: parseFloat(a.balance),
      aprNum: parseFloat(a.apr || '0'),
      minPaymentNum: parseFloat(a.minPayment),
      ...calculatePayoff(parseFloat(a.minPayment), parseFloat(a.balance), parseFloat(a.apr || '0'))
    }));

    const combinedMinResults = calculatePayoff(totalMinPayment, totalBalance, weightedAPR);
    
    const scenarios = [
      { 
        label: 'Minimum Only', 
        payment: totalMinPayment, 
        ...combinedMinResults, 
        gradient: 'from-red-500 to-red-600'
      },
      { 
        label: '+$50/Month', 
        payment: totalMinPayment + 50, 
        ...calculatePayoff(totalMinPayment + 50, totalBalance, weightedAPR), 
        gradient: 'from-orange-500 to-orange-600'
      },
      { 
        label: '+$100/Month', 
        payment: totalMinPayment + 100, 
        ...calculatePayoff(totalMinPayment + 100, totalBalance, weightedAPR), 
        gradient: 'from-yellow-500 to-yellow-600'
      },
      { 
        label: 'Double Payment', 
        payment: totalMinPayment * 2, 
        ...calculatePayoff(totalMinPayment * 2, totalBalance, weightedAPR), 
        gradient: 'from-green-500 to-green-600'
      }
    ];

    const currentYear = new Date().getFullYear();
    const scenariosWithYears = scenarios.map(s => ({
      ...s,
      debtFreeYear: s.months === Infinity ? '∞' : currentYear + Math.floor(s.months / 12)
    }));

    const customPaymentTotal = totalMinPayment + customPayment;
    const customResults = calculatePayoff(customPaymentTotal, totalBalance, weightedAPR);
    const customYear = customResults.months === Infinity ? '∞' : currentYear + Math.floor(customResults.months / 12);
    const customInterestSaved = combinedMinResults.totalInterest === Infinity || customResults.totalInterest === Infinity ? Infinity : combinedMinResults.totalInterest - customResults.totalInterest;

    const moneySavingTips = [
        { icon: DollarSign, label: 'Make coffee at home', amount: 80, description: 'Skip the $5 latte, brew your own' },
        { icon: Smartphone, label: 'Cancel unused subscriptions', amount: 45, description: 'Netflix, Hulu, gym you never use' },
        { icon: DollarSign, label: 'Pack lunch 3x per week', amount: 90, description: 'Save $7.50 per homemade lunch' },
        { icon: PiggyBank, label: 'Use cashback apps', amount: 35, description: 'Rakuten, Ibotta, Fetch Rewards' },
        { icon: TrendingDown, label: 'Negotiate bills', amount: 65, description: 'Call internet/insurance/phone' },
        { icon: Lightbulb, label: 'Shop with a list', amount: 50, description: 'Stop impulse buying at stores' },
        { icon: Lightbulb, label: 'Switch to LED bulbs', amount: 25, description: 'Lower electric bill instantly' },
        { icon: DollarSign, label: 'Meal prep on Sundays', amount: 75, description: 'Cook once, eat all week' },
        { icon: DollarSign, label: 'Buy generic brands', amount: 30, description: 'Same quality, way less money' },
        { icon: DollarSign, label: 'Sell unused items', amount: 100, description: 'Facebook Marketplace, eBay, Craigslist' },
        { icon: Heart, label: 'Cancel the gym', amount: 50, description: 'Use YouTube workouts or run outside' },
        { icon: BookOpen, label: 'Library instead of buying', amount: 40, description: 'Books, movies, audiobooks free' },
        { icon: DollarSign, label: 'Buy used/refurbished', amount: 55, description: 'Electronics, furniture, clothes' },
        { icon: DollarSign, label: 'Carpool or public transit', amount: 120, description: 'Save on gas, parking, wear' },
        { icon: DollarSign, label: 'DIY haircuts or cheaper salon', amount: 35, description: 'YouTube tutorials or Supercuts' },
        { icon: DollarSign, label: 'DIY home repairs', amount: 60, description: 'YouTube teaches everything' },
        { icon: DollarSign, label: 'Brew tea vs energy drinks', amount: 45, description: '$0.10 per cup vs $3+ cans' },
        { icon: DollarSign, label: '24-hour purchase rule', amount: 70, description: 'Wait before any non-essential buy' },
        { icon: DollarSign, label: 'Use coupons religiously', amount: 40, description: 'Honey, RetailMeNot, store apps' },
        { icon: DollarSign, label: 'Lower thermostat 2-3°', amount: 40, description: 'Won\'t notice, wallet will' },
        { icon: Smartphone, label: 'Downgrade phone plan', amount: 30, description: 'Do you really need unlimited?' },
        { icon: DollarSign, label: 'Refinance high-interest debt', amount: 150, description: 'Balance transfer to 0% card' }
      ];

    const interestVsPrincipal = [
      { name: 'Money You Borrowed', value: totalBalance, fill: '#3b82f6' },
      { name: 'Interest You\'ll Burn', value: scenariosWithYears[0].totalInterest === Infinity ? totalBalance * 2 : scenariosWithYears[0].totalInterest, fill: '#ef4444' }
    ];

    return {
      totalBalance,
      totalMinPayment,
      weightedAPR,
      scenarios: scenariosWithYears,
      accountResults,
      moneySavingTips,
      interestVsPrincipal,
      customResults,
      customYear,
      customPaymentTotal,
      customInterestSaved,
    };
  }, [accounts, customPayment]);

  const handleCalculate = () => {
    setShowResults(true);
    setCustomPayment(0);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const generatePDF = () => {
    if (!results) return;
    const content = `Your Debt Freedom Plan - Generated: ${new Date().toLocaleDateString()}\n...`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debt-freedom-plan-${new Date().getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const sharePage = (platform: 'facebook' | 'twitter' | 'email') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this free Minimum Payment Calculator. The results are shocking!");
    let shareUrl = '';

    if (platform === 'facebook') {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'twitter') {
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    } else if (platform === 'email') {
        shareUrl = `mailto:?subject=Debt Freedom Calculator&body=${text}%20${url}`;
    }
    window.open(shareUrl, '_blank');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm text-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-red-500/30">
            <Flame className="w-4 h-4" />
            <span>The Truth Your Credit Card Company Hates</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            Minimum Payment
            <span className="block bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 text-transparent bg-clip-text">
              Calculator
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
            See exactly when you'll be debt-free and how much you'll *really* pay.
            <span className="text-red-400 font-semibold"> The numbers will shock you.</span>
          </p>
          
          <div className="max-w-4xl mx-auto bg-blue-500/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-blue-500/30">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/30 rounded-full p-3 flex-shrink-0">
                <Lightbulb className="w-8 h-8 text-blue-300" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold mb-3">Here's What This Tool Does (In Plain English):</h2>
                <div className="space-y-3 text-gray-200 text-lg leading-relaxed">
                  <p><span className="font-bold text-white">Step 1:</span> Enter your credit card balance, interest rate, and monthly payment.</p>
                  <p><span className="font-bold text-white">The Shocking Part:</span> If you pay just the minimum, you could be in debt for 10-20+ years and pay DOUBLE what you borrowed!</p>
                  <p><span className="font-bold text-white">The Good News:</span> Paying even $50 extra a month can save you thousands of dollars and years of your life.</p>
                  <p className="text-yellow-300 font-semibold mt-4">💡 Think of it like this: Would you rather pay $10,000 over 20 years, or $7,000 over 3 years? This tool shows you how.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Enter Your Debt Information</h2>
            <p className="text-gray-300 text-lg">Find these numbers on your credit card statement</p>
          </div>

          {accounts.map((account) => (
            <div key={account.id} className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                  className="text-xl font-bold bg-transparent border-b-2 border-white/20 focus:border-blue-400 outline-none transition px-2 py-1"
                  placeholder="Card Name (e.g., Chase)"
                />
                {accounts.length > 1 && (
                  <button onClick={() => removeAccount(account.id)} className="text-red-400 hover:text-red-300 transition p-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> <span className="text-sm">Remove</span>
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">💵 Balance</label>
                  <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" /><input type="number" value={account.balance} onChange={(e) => updateAccount(account.id, 'balance', e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 outline-none transition text-xl font-semibold" placeholder="5000" /></div>
                </div>
                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">📈 APR (%)</label>
                  <div className="relative"><TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" /><input type="number" step="0.01" value={account.apr} onChange={(e) => updateAccount(account.id, 'apr', e.target.value)} className="w-full pl-11 pr-14 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:border-red-400 outline-none transition text-xl font-semibold" placeholder="19.99" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span></div>
                </div>
                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">💳 Monthly Payment</label>
                  <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" /><input type="number" value={account.minPayment} onChange={(e) => updateAccount(account.id, 'minPayment', e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:border-green-400 outline-none transition text-xl font-semibold" placeholder="100" /></div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-6">
            <button onClick={addAccount} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-xl transition font-semibold text-lg"><Plus className="w-5 h-5" /> Add Another</button>
            <button onClick={handleCalculate} className="w-1/2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg text-xl">Show Me The Truth</button>
          </div>
        </div>

        <Suspense fallback={<div className="text-center text-2xl p-10">Calculating your financial future...</div>}>
            {showResults && <CalculatorResults 
                                results={results} 
                                customPayment={customPayment} 
                                setCustomPayment={setCustomPayment} 
                                generatePDF={generatePDF} 
                                setShowBlogModal={setShowBlogModal} 
                                setShowShareModal={setShowShareModal} 
                            />}
        </Suspense>
      </div>

      {showBlogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between z-10"><h2 className="text-3xl font-black flex items-center gap-3"><BookOpen className="w-8 h-8" /> Complete Debt Freedom Guide</h2><button onClick={() => setShowBlogModal(false)} className="hover:bg-white/20 p-2 rounded-xl transition"><X className="w-6 h-6" /></button></div>
            <div className="p-8 space-y-6">
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20"><h3 className="text-2xl font-bold mb-3 text-yellow-300">Why Minimum Payments Are a Trap</h3><p className="text-white/90 leading-relaxed text-lg">Credit card companies design minimum payments to maximize profit. They ensure you stay in debt for decades while they collect interest. This calculator shows you the real numbers they hope you never see.</p></div>
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20"><h3 className="text-2xl font-bold mb-3 text-blue-300">The Avalanche Method (Best for Saving Money)</h3><p className="text-white/90 leading-relaxed text-lg">Attack your highest interest rate debt first while paying minimums on everything else. This mathematically saves you the most money in interest over time.</p></div>
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20"><h3 className="text-2xl font-bold mb-3 text-pink-300">The Snowball Method (Best for Motivation)</h3><p className="text-white/90 leading-relaxed text-lg">Pay off your smallest balance first for quick wins. The motivation from seeing debts disappear keeps people going. Sometimes psychology beats math!</p></div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-center"><h3 className="text-3xl font-black mb-4">Your Turn - Start Today!</h3><p className="mb-6 text-xl">Every day you wait, more interest piles up.</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setShowBlogModal(false)} className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition text-lg">Go Back & Make My Plan</button>
                    <a href="/blog.html" className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/20 transition text-lg">Explore More Resources</a>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {showShareModal && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowShareModal(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full p-8 border-2 border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-center mb-6">Share This Tool</h2>
                <div className="flex justify-center gap-4">
                    <button onClick={() => sharePage('facebook')} className="w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition-transform transform hover:scale-110"><Facebook size={32} /></button>
                    <button onClick={() => sharePage('twitter')} className="w-16 h-16 flex items-center justify-center bg-sky-500 hover:bg-sky-600 rounded-full transition-transform transform hover:scale-110"><Twitter size={32} /></button>
                    <button onClick={() => sharePage('email')} className="w-16 h-16 flex items-center justify-center bg-gray-600 hover:bg-gray-700 rounded-full transition-transform transform hover:scale-110"><Mail size={32} /></button>
                </div>
            </div>
         </div>
      )}
      
      {/* AdSense Ad Slot 1 */}
      <div className="ad-container my-8">
        <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-3037944530219260"
            data-ad-slot="YOUR_AD_SLOT_ID_1_HERE"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
      </div>

      {/* AdSense Ad Slot 2 */}
      <div className="ad-container my-8">
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-3037944530219260"
             data-ad-slot="YOUR_AD_SLOT_ID_2_HERE"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>

    </div>
  );
}

export default MinimumPaymentCalculator;
