import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingDown, Calendar, Zap, Download, AlertTriangle, TrendingUp, Coffee, Smartphone, CreditCard, PiggyBank, Clock, Award, Target, Flame, Plus, Trash2, X, BookOpen, ArrowRight, CheckCircle, ArrowDown, Lightbulb, TrendingDownIcon, PlayCircle, Package, Home, Car, Book, Scissors, Wrench, Heart, ShoppingCart, Repeat, Share2, Twitter, Facebook, Copy } from 'lucide-react';

// Define a strict type for an account
interface Account {
  id: number;
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
}

// Define the type for the tooltip payload
interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    name: string;
  };
  color: string;
}

export default function MinimumPaymentCalculator() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: 'Credit Card 1', balance: '5000', apr: '19.99', minPayment: '100' }
  ]);
  const [showResults, setShowResults] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [customPayment, setCustomPayment] = useState(0);
  const [copied, setCopied] = useState(false);

  // Effect to push ads when results are shown
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
    const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    setAccounts([...accounts, { 
      id: newId, 
      name: `Credit Card ${accounts.length + 1}`, 
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
    if (principal <= 0) return { months: 0, totalPaid: 0, totalInterest: 0, monthlyData: [] };
    
    const monthlyRate = annualRate > 0 ? annualRate / 100 / 12 : 0;
    let currentBalance = principal;
    let totalInterest = 0;
    let months = 0;
    const maxMonths = 600; // 50 years
    const monthlyData: { month: number; balance: number; totalPaid: number; interest: number; principal: number; }[] = [];

    while (currentBalance > 0.01 && months < maxMonths) {
      const interestCharge = currentBalance * monthlyRate;
      
      if (monthlyPayment <= interestCharge && annualRate > 0) return { 
        months: Infinity, 
        totalPaid: Infinity, 
        totalInterest: Infinity,
        monthlyData: []
      };

      const principalPayment = Math.min(monthlyPayment - interestCharge, currentBalance);
      
      totalInterest += interestCharge;
      currentBalance -= principalPayment;
      months++;

      if (months % 6 === 0 || currentBalance <= 0.01) {
        monthlyData.push({
          month: months,
          balance: Math.max(0, currentBalance),
          totalPaid: principal - currentBalance + totalInterest,
          interest: totalInterest,
          principal: principal - currentBalance
        });
      }
    }
    
    if (months >= maxMonths && currentBalance > 0.01) {
       return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity, monthlyData: [] };
    }

    return { months, totalPaid: principal + totalInterest, totalInterest, monthlyData };
  };

  const results = useMemo(() => {
    const validAccounts = accounts.filter(a => 
      parseFloat(a.balance) > 0 && 
      parseFloat(a.apr) >= 0 && // Allow 0 APR
      parseFloat(a.minPayment) > 0
    );

    if (validAccounts.length === 0) return null;

    const totalBalance = validAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const totalMinPayment = validAccounts.reduce((sum, a) => sum + parseFloat(a.minPayment), 0);
    
    const weightedAPR = totalBalance > 0 ? validAccounts.reduce((sum, a) => {
      return sum + (parseFloat(a.apr) * parseFloat(a.balance));
    }, 0) / totalBalance : 0;

    const accountResults = validAccounts.map(a => ({
      ...a,
      balanceNum: parseFloat(a.balance),
      aprNum: parseFloat(a.apr),
      minPaymentNum: parseFloat(a.minPayment),
      ...calculatePayoff(parseFloat(a.minPayment), parseFloat(a.balance), parseFloat(a.apr))
    }));

    const combinedMinResults = calculatePayoff(totalMinPayment, totalBalance, weightedAPR);
    
    const scenarios = [
      { 
        label: 'Minimum Only', 
        shortLabel: 'Min',
        payment: totalMinPayment, 
        ...combinedMinResults, 
        color: '#ef4444',
        gradient: 'from-red-500 to-red-600'
      },
      { 
        label: '+$50/Month', 
        shortLabel: '+$50',
        payment: totalMinPayment + 50, 
        ...calculatePayoff(totalMinPayment + 50, totalBalance, weightedAPR), 
        color: '#f97316',
        gradient: 'from-orange-500 to-orange-600'
      },
      { 
        label: '+$100/Month', 
        shortLabel: '+$100',
        payment: totalMinPayment + 100, 
        ...calculatePayoff(totalMinPayment + 100, totalBalance, weightedAPR), 
        color: '#eab308',
        gradient: 'from-yellow-500 to-yellow-600'
      },
      { 
        label: 'Double Payment', 
        shortLabel: '2x Min',
        payment: totalMinPayment * 2, 
        ...calculatePayoff(totalMinPayment * 2, totalBalance, weightedAPR), 
        color: '#22c55e',
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

    const moneySavingTips = [
      { icon: Coffee, label: 'Make coffee at home', amount: 80, description: 'Skip the $5 latte, brew your own', emoji: '☕', category: 'Daily Habits', proven: '87% of people overspend on coffee', difficulty: 'Easy' },
      { icon: Smartphone, label: 'Cancel unused subscriptions', amount: 45, description: 'Netflix, Hulu, gym you never use', emoji: '📱', category: 'Subscriptions', proven: 'Average $237/yr in forgotten subs', difficulty: 'Easy' },
      { icon: CreditCard, label: 'Pack lunch 3x per week', amount: 90, description: 'Save $7.50 per homemade lunch', emoji: '🥪', category: 'Food', proven: 'Dining out costs 5x more', difficulty: 'Easy' },
      { icon: PiggyBank, label: 'Use cashback apps', amount: 35, description: 'Rakuten, Ibotta, Fetch Rewards', emoji: '💰', category: 'Shopping', proven: 'Average user saves $350/year', difficulty: 'Easy' },
      { icon: TrendingDown, label: 'Negotiate bills', amount: 65, description: 'Call internet/insurance/phone', emoji: '📞', category: 'Bills', proven: '85% success rate when you ask', difficulty: 'Medium' },
      { icon: Target, label: 'Shop with a list', amount: 50, description: 'Stop impulse buying at stores', emoji: '📝', category: 'Shopping', proven: 'Reduces spending by 15%', difficulty: 'Easy' },
      { icon: Lightbulb, label: 'Switch to LED bulbs', amount: 25, description: 'Lower electric bill instantly', emoji: '💡', category: 'Utilities', proven: 'Save $75/year per bulb', difficulty: 'Easy' },
      { icon: Clock, label: 'Meal prep on Sundays', amount: 75, description: 'Cook once, eat all week', emoji: '🍱', category: 'Food', proven: 'Cuts food costs by 25%', difficulty: 'Medium' },
      { icon: CheckCircle, label: 'Buy generic brands', amount: 30, description: 'Same quality, way less money', emoji: '🏷️', category: 'Shopping', proven: 'Save 20-40% on groceries', difficulty: 'Easy' },
      { icon: Package, label: 'Sell unused items', amount: 100, description: 'Facebook Marketplace, eBay, Craigslist', emoji: '📦', category: 'Extra Income', proven: 'Average home has $3,000 unused', difficulty: 'Medium' },
      { icon: Heart, label: 'Cancel the gym', amount: 50, description: 'Use YouTube workouts or run outside', emoji: '🏃', category: 'Fitness', proven: '80% of memberships go unused', difficulty: 'Easy' },
      { icon: Book, label: 'Library instead of buying', amount: 40, description: 'Books, movies, audiobooks free', emoji: '📚', category: 'Entertainment', proven: 'Save $30-50/month easily', difficulty: 'Easy' },
      { icon: ShoppingCart, label: 'Buy used/refurbished', amount: 55, description: 'Electronics, furniture, clothes', emoji: '♻️', category: 'Shopping', proven: 'Save 30-70% off retail', difficulty: 'Easy' },
      { icon: Car, label: 'Carpool or public transit', amount: 120, description: 'Save on gas, parking, wear', emoji: '🚗', category: 'Transportation', proven: 'Save $200+/month on gas', difficulty: 'Medium' },
      { icon: Scissors, label: 'DIY haircuts or cheaper salon', amount: 35, description: 'YouTube tutorials or Supercuts', emoji: '✂️', category: 'Personal Care', proven: 'Save $420/year on cuts', difficulty: 'Medium' },
      { icon: Wrench, label: 'DIY home repairs', amount: 60, description: 'YouTube teaches everything', emoji: '🔧', category: 'Home', proven: 'Save 50-80% vs hiring', difficulty: 'Medium' },
      { icon: Coffee, label: 'Brew tea vs energy drinks', amount: 45, description: '$0.10 per cup vs $3+ cans', emoji: '🍵', category: 'Daily Habits', proven: 'Save $90/month if daily', difficulty: 'Easy' },
      { icon: Clock, label: '24-hour purchase rule', amount: 70, description: 'Wait before any non-essential buy', emoji: '⏰', category: 'Shopping', proven: 'Prevents 60% impulse buys', difficulty: 'Easy' },
      { icon: Target, label: 'Use coupons religiously', amount: 40, description: 'Honey, RetailMeNot, store apps', emoji: '🎫', category: 'Shopping', proven: 'Average $50/month savings', difficulty: 'Easy' },
      { icon: Home, label: 'Lower thermostat 2-3°', amount: 40, description: 'Won\'t notice, wallet will', emoji: '🌡️', category: 'Utilities', proven: '1% savings per degree', difficulty: 'Easy' },
      { icon: Smartphone, label: 'Downgrade phone plan', amount: 30, description: 'Do you really need unlimited?', emoji: '📲', category: 'Bills', proven: 'Save $360/year on average', difficulty: 'Easy' },
      { icon: Repeat, label: 'Refinance high-interest debt', amount: 150, description: 'Balance transfer to 0% card', emoji: '🔄', category: 'Debt Strategy', proven: 'Can save thousands in interest', difficulty: 'Medium' }
    ];

    const comparisonData = scenariosWithYears.map(s => ({
      name: s.shortLabel,
      'Total Cost': s.totalPaid === Infinity ? 0 : s.totalPaid,
      'Original Debt': totalBalance,
      'Interest': s.totalInterest === Infinity ? 0 : s.totalInterest,
      years: s.months === Infinity ? 0 : (s.months / 12).toFixed(1),
      color: s.color
    }));

    const debtBreakdown = accountResults.map(a => ({
      name: a.name,
      value: a.balanceNum,
      percentage: ((a.balanceNum / totalBalance) * 100).toFixed(1)
    }));

    const interestVsPrincipal = [
      { name: 'Money You Borrowed', value: totalBalance, fill: '#3b82f6' },
      { name: 'Interest You\'ll Burn', value: scenariosWithYears[0].totalInterest === Infinity ? 0 : scenariosWithYears[0].totalInterest, fill: '#ef4444' }
    ];

    return {
      totalBalance,
      totalMinPayment,
      weightedAPR,
      scenarios: scenariosWithYears,
      accountResults,
      moneySavingTips,
      comparisonData,
      debtBreakdown,
      interestVsPrincipal,
      customResults,
      customYear,
      customPaymentTotal
    };
  }, [accounts, customPayment]);

  const formatCurrency = (num: number) => {
    if (num === Infinity || isNaN(num)) return '∞';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num);
  };
  
  const formatTime = (months: number): string => {
    if (months === Infinity || isNaN(months) || months < 0) return 'Never';
    if (months < 1) return 'Less than a month';

    const totalMonths = Math.round(months);
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    const yearString = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
    const monthString = remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : '';

    if (yearString && monthString) {
      return `${yearString}, ${monthString}`;
    }
    return yearString || monthString;
  };

  const handleCalculate = () => {
    setShowResults(true);
    setCustomPayment(0);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generatePDF = () => {
    if (!results) return;

    const content = `
╔═══════════════════════════════════════════════════════════╗
║         YOUR DEBT FREEDOM PLAN - PERSONALIZED ROADMAP     ║
║                   Generated: ${new Date().toLocaleDateString()}                   ║
╚═══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 YOUR DEBT ACCOUNTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.accountResults.map((a, i) => `
${i + 1}. ${a.name.toUpperCase()}
   Balance:             ${formatCurrency(a.balanceNum)}
   Interest Rate:       ${a.aprNum}% APR
   Monthly Payment:     ${formatCurrency(a.minPaymentNum)}
   Payoff Time:         ${formatTime(a.months)}
   Total Interest:      ${formatCurrency(a.totalInterest)}
`).join('\n')}

COMBINED TOTALS:
Total Debt:             ${formatCurrency(results.totalBalance)}
Total Monthly Payment:  ${formatCurrency(results.totalMinPayment)}
Average Interest Rate:  ${results.weightedAPR.toFixed(2)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 YOUR 4 PATHS - THE CHOICE IS YOURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.scenarios.map((s, i) => `
${['🔴', '🟠', '🟡', '🟢'][i]} ${s.label.toUpperCase()}
   ┌─────────────────────────────────────────────────────┐
   │ Monthly Payment:     ${formatCurrency(s.payment).padEnd(20)} │
   │ Debt-Free By:        ${String(s.debtFreeYear).padEnd(20)} │
   │ Time Until Freedom:  ${formatTime(s.months).padEnd(20)} │
   │ Interest You'll Pay: ${formatCurrency(s.totalInterest).padEnd(20)} │
   │ Total You'll Pay:    ${formatCurrency(s.totalPaid).padEnd(20)} │
   └─────────────────────────────────────────────────────┘
   ${i > 0 && results.weightedAPR > 0 ? `💰 SAVE: ${formatCurrency(results.scenarios[0].totalInterest - s.totalInterest)} vs minimum
   ⏰ FREE: ${formatTime(results.scenarios[0].months - s.months)} SOONER!\n` : ''}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 22 PROVEN WAYS TO FIND EXTRA MONEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.moneySavingTips.map((tip, i) => `
${tip.emoji} ${i + 1}. ${tip.label.toUpperCase()} → +${formatCurrency(tip.amount)}/month
   Category: ${tip.category} | Difficulty: ${tip.difficulty}
   How: ${tip.description}
   Proof: ${tip.proven}
`).join('\n')}

TOTAL POTENTIAL: ${formatCurrency(results.moneySavingTips.reduce((sum, t) => sum + t.amount, 0))}/month!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR ACTION PLAN - START TODAY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Week 1: Pick 3 "Easy" tips and implement them
Week 2: Set up automatic extra payment
Week 3: Try 2 more tips from the list
Week 4: Celebrate your first month of progress!

REMEMBER:
✓ Every extra dollar goes to principal (not interest!)
✓ Small changes add up to big results
✓ You're closer to freedom than you think

Generated by SecretSantaMatch.com - Your FREE Debt Freedom Calculator
Visit SecretSantaMatch.com for more free tools!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debt-freedom-plan-${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="font-semibold">{payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm text-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-red-500/30">
            <Flame className="w-4 h-4" />
            <span>The Truth Your Credit Card Company Doesn't Want You to Know</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            Minimum Payment
            <span className="block bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 text-transparent bg-clip-text">
              Calculator
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
            See exactly when you'll be debt-free and how much you'll really pay.
            <span className="text-red-400 font-semibold"> The numbers will shock you.</span>
          </p>
          
          <div className="max-w-4xl mx-auto bg-blue-500/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-blue-500/30 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/30 rounded-full p-3 flex-shrink-0">
                <Lightbulb className="w-8 h-8 text-blue-300" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white mb-3">Here's What This Tool Does (In Plain English):</h2>
                <div className="space-y-3 text-gray-200 text-lg leading-relaxed">
                  <p><span className="font-bold text-white">Step 1:</span> Enter your credit card balance, interest rate, and what you're paying each month.</p>
                  <p><span className="font-bold text-white">Step 2:</span> Click "Calculate" and we'll show you exactly when you'll be debt-free.</p>
                  <p><span className="font-bold text-white">The Shocking Part:</span> If you keep paying just the minimum, you could be in debt for 10-20+ years and pay DOUBLE what you borrowed!</p>
                  <p><span className="font-bold text-white">The Good News:</span> Paying even $50 more each month can save you thousands of dollars and years of your life.</p>
                  <p className="text-yellow-300 font-semibold mt-4">💡 Think of it this way: Would you rather pay $10,000 over 20 years, or $7,000 over 3 years? That's the difference!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Step 1: Enter Your Debt Information</h2>
            <p className="text-gray-300 text-lg">Find these numbers on your credit card statement</p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Your Debts</h3>
              <p className="text-gray-400 text-sm">Have multiple cards? Add them all!</p>
            </div>
            <button onClick={addAccount} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl transition font-semibold text-lg">
              <Plus className="w-5 h-5" />
              Add Another Card
            </button>
          </div>

          {accounts.map((account) => (
            <div key={account.id} className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-b-2 border-white/20 focus:border-blue-400 outline-none transition px-2 py-1"
                  placeholder="Card Name (e.g., Chase, Discover)"
                />
                {accounts.length > 1 && (
                  <button onClick={() => removeAccount(account.id)} className="text-red-400 hover:text-red-300 transition p-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    <span className="text-sm">Remove</span>
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">💵 How Much You Owe</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition"></div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <input
                        type="number"
                        value={account.balance}
                        onChange={(e) => updateAccount(account.id, 'balance', e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl focus:border-blue-400 focus:bg-white/20 outline-none transition text-white text-xl font-semibold placeholder-gray-500"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 ml-1">Current balance on your statement</p>
                </div>

                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">📈 Interest Rate (APR)</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition"></div>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={account.apr}
                        onChange={(e) => updateAccount(account.id, 'apr', e.target.value)}
                        className="w-full pl-11 pr-14 py-4 bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl focus:border-red-400 focus:bg-white/20 outline-none transition text-white text-xl font-semibold placeholder-gray-500"
                        placeholder="19.99"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 ml-1">Found on your statement (usually 15-25%)</p>
                </div>

                <div>
                  <label className="block text-base font-bold text-white/90 mb-2">💳 Your Monthly Payment</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition"></div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <input
                        type="number"
                        value={account.minPayment}
                        onChange={(e) => updateAccount(account.id, 'minPayment', e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-white/10 backdrop-blur border-2 border-white/20 rounded-xl focus:border-green-400 focus:bg-white/20 outline-none transition text-white text-xl font-semibold placeholder-gray-500"
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 ml-1">What you currently pay each month</p>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleCalculate}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-6 rounded-2xl transition-all transform hover:scale-[1.02] shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center gap-3 text-2xl relative overflow-hidden group mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <PlayCircle className="w-8 h-8 relative z-10" />
            <span className="relative z-10">Show Me The Truth</span>
          </button>
        </div>

        {showResults && results && (
          <div id="results-section" className="space-y-8">
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-red-400/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <AlertTriangle className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">If You Keep Paying Just {formatCurrency(results.totalMinPayment)}/Month...</h2>
                    <p className="text-xl md:text-2xl text-white/95 leading-relaxed">Here's what will happen to you:</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/30 mb-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center md:text-left">
                      <p className="text-white/80 text-lg font-medium mb-2">YOU'LL FINALLY BE DEBT-FREE IN...</p>
                      <p className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-3">{results.scenarios[0].debtFreeYear}</p>
                      <p className="text-white text-2xl font-bold">That's <span className="text-yellow-300">{formatTime(results.scenarios[0].months)}</span> from now!</p>
                      <p className="text-white/70 text-lg mt-2">Imagine making payments for that long...</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-white/80 text-lg font-medium mb-2">YOU'LL PAY THIS MUCH IN TOTAL...</p>
                      <p className="text-6xl md:text-8xl font-black text-yellow-300 mb-3">{formatCurrency(results.scenarios[0].totalPaid)}</p>
                      <p className="text-white text-xl">But you only borrowed <span className="font-bold">{formatCurrency(results.totalBalance)}</span></p>
                      <p className="text-red-200 text-2xl font-bold mt-3">💸 That's {formatCurrency(results.scenarios[0].totalInterest)} burned on interest!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30">
                  <p className="text-white text-xl md:text-2xl font-bold text-center">💔 You'll pay <span className="text-yellow-300 text-3xl">{((results.scenarios[0].totalInterest / results.totalBalance) * 100).toFixed(0)}%</span> MORE than you borrowed!</p>
                  <p className="text-white/90 text-center mt-2 text-lg">That's money that could go to vacations, savings, or your kids' college fund.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-white/30">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">✨ But Here's The GOOD News!</h2>
                <p className="text-2xl text-white/95">By paying just a little bit more each month, you can save THOUSANDS and get out of debt YEARS sooner.</p>
              </div>

              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-8 border border-white/30">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">For Example: Add Just $50/Month...</h3>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-white/80 text-lg mb-2">You'll Save</p>
                    <p className="text-5xl font-black text-yellow-300">
                       {results.weightedAPR > 0 ? formatCurrency(results.scenarios[0].totalInterest - results.scenarios[1].totalInterest) : (<span className="text-lg normal-case font-medium tracking-normal text-white/80">(No interest to save with 0% APR)</span>)}
                    </p>
                    {results.weightedAPR > 0 && <p className="text-white/90 mt-2">In interest!</p>}
                  </div>
                  <div>
                    <p className="text-white/80 text-lg mb-2">Debt-Free In</p>
                    <p className="text-5xl font-black text-white">{results.scenarios[1].debtFreeYear}</p>
                    <p className="text-white/90 mt-2">Instead of {results.scenarios[0].debtFreeYear}!</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-lg mb-2">Debt-Free Sooner By</p>
                    <p className="text-4xl font-black text-white">{formatTime(results.scenarios[0].months - results.scenarios[1].months)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ad-container text-center my-4">
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-3037944530219260"
                     data-ad-slot="YOUR_AD_SLOT_ID_1_HERE"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-white mb-3 flex items-center justify-center gap-3">
                  <Zap className="w-10 h-10 text-yellow-400" />
                  Try It Yourself! Slide to See the Magic
                </h2>
                <p className="text-xl text-gray-300">Move the slider to see how paying more changes everything</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="mb-8">
                  <label className="block text-2xl font-bold text-white mb-4 text-center">Add Extra Payment: <span className="text-yellow-300">{formatCurrency(customPayment)}</span> per month</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={customPayment}
                    onChange={(e) => setCustomPayment(parseInt(e.target.value))}
                    className="w-full h-4 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-white/60 mt-2 text-lg">
                    <span>$0</span>
                    <span>$250</span>
                    <span>$500</span>
                  </div>
                </div>

                {customPayment > 0 && (
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8">
                    <h3 className="text-3xl font-bold text-white mb-6 text-center">If You Pay {formatCurrency(results.customPaymentTotal)}/Month:</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-white/80 text-lg mb-2">Debt-Free By</p>
                        <p className="text-6xl font-black text-yellow-300">{results.customYear}</p>
                        <p className="text-white/90 mt-2 text-lg">{formatTime(results.customResults.months)}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-white/80 text-lg mb-2">You'll Save</p>
                        <p className="text-5xl font-black text-yellow-300">
                          {results.weightedAPR > 0 ? formatCurrency(results.scenarios[0].totalInterest - results.customResults.totalInterest) : (<span className="text-lg normal-case font-medium tracking-normal text-white/80">(No interest to save with 0% APR)</span>)}
                        </p>
                        {results.weightedAPR > 0 && <p className="text-white/90 mt-2">vs minimum payment!</p>}
                      </div>
                      <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-white/80 text-lg mb-2">Debt-Free Sooner By</p>
                        <p className="text-5xl font-black text-white">{formatTime(results.scenarios[0].months - results.customResults.months)}</p>
                      </div>
                    </div>
                    <p className="text-center text-white text-xl mt-6 font-semibold">🎉 That's the power of paying just a little bit more!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">
              <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-400" />
                See The Difference: Money Borrowed vs. Interest Burned
              </h2>
              <p className="text-xl text-gray-300 mb-8">This chart shows why minimum payments are a trap</p>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.interestVsPrincipal} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis type="number" stroke="#ffffff80" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="name" stroke="#ffffff80" width={200} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {results.interestVsPrincipal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
              <h2 className="text-4xl font-black text-white mb-3 text-center">Your 4 Choices - Which Path Will You Take?</h2>
              <p className="text-xl text-gray-300 text-center mb-8">Each choice leads to a completely different future</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {results.scenarios.map((scenario, index) => (
                  <div key={index} className={`bg-gradient-to-br ${scenario.gradient} rounded-3xl p-8 shadow-2xl border-2 border-white/30 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-white mb-1">{scenario.label}</h3>
                          <p className="text-4xl font-bold text-white/90">{formatCurrency(scenario.payment)}<span className="text-xl">/mo</span></p>
                        </div>
                        {index === 0 && (<span className="bg-red-200 text-red-900 text-sm font-bold px-4 py-2 rounded-full">⚠️ TRAP</span>)}
                        {index === 3 && (<span className="bg-white text-green-700 text-sm font-bold px-4 py-2 rounded-full">⭐ BEST</span>)}
                      </div>

                      <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 mb-4 border border-white/30">
                        <p className="text-white/80 text-base font-bold mb-2">DEBT-FREE BY</p>
                        <p className="text-6xl font-black text-white">{scenario.debtFreeYear}</p>
                        <p className="text-white text-lg mt-2">{formatTime(scenario.months)}</p>
                      </div>

                      <div className="space-y-3 mb-4 text-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-white/90 font-medium">Interest Paid</span>
                          <span className="text-white text-xl font-bold">{formatCurrency(scenario.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/90 font-medium">Total You'll Pay</span>
                          <span className="text-white text-xl font-bold">{formatCurrency(scenario.totalPaid)}</span>
                        </div>
                      </div>

                      {index > 0 && results.weightedAPR > 0 && (
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4 border border-white/30">
                          <p className="text-white font-bold text-xl mb-1">💰 Save {formatCurrency(results.scenarios[0].totalInterest - scenario.totalInterest)}</p>
                          <p className="text-white text-base">Get free {formatTime(results.scenarios[0].months - scenario.months)} sooner!</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-white/30">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">💡 22 Proven Ways to Find Extra Money</h2>
                <p className="text-2xl text-white/95 mb-3">Real strategies that real people use. Total potential: <span className="font-black text-yellow-300 text-3xl">{formatCurrency(results.moneySavingTips.reduce((sum, t) => sum + t.amount, 0))}/month!</span></p>
                <p className="text-xl text-white/80">Pick just 3 and watch your debt melt away faster</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.moneySavingTips.map((tip, index) => {
                  const Icon = tip.icon;
                  const newPayment = results.totalMinPayment + tip.amount;
                  const newResults = calculatePayoff(newPayment, results.totalBalance, results.weightedAPR);
                  const savings = results.scenarios[0].totalInterest - newResults.totalInterest;
                  const timeSaved = results.scenarios[0].months - newResults.months;
                  const newYear = newResults.months === Infinity ? '∞' : new Date().getFullYear() + Math.floor(newResults.months / 12);
                  
                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-[1.02] group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-white/20 backdrop-blur rounded-xl p-3 group-hover:scale-110 transition-transform">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-white leading-tight">{tip.label}</h3>
                            <span className="text-3xl">{tip.emoji}</span>
                          </div>
                          <p className="text-sm text-yellow-300 font-semibold mb-2">{tip.category} • {tip.difficulty}</p>
                          <p className="text-white/90 text-base mb-3 leading-relaxed">{tip.description}</p>
                          <p className="text-3xl font-black text-yellow-300">+{formatCurrency(tip.amount)}/mo</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 mb-3">
                        <p className="text-white/80 text-sm mb-3 leading-relaxed">📊 {tip.proven}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-white/70 text-sm mb-1">You'd Save</p>
                            <p className="text-white text-lg font-bold">{results.weightedAPR > 0 ? formatCurrency(savings) : '—'}</p>
                          </div>
                          <div>
                            <p className="text-white/70 text-sm mb-1">Free By</p>
                            <p className="text-white text-lg font-bold">{newYear}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <button
                  onClick={() => setShowBlogModal(true)}
                  className="inline-flex items-center gap-3 bg-white text-purple-600 hover:bg-gray-100 font-bold px-10 py-5 rounded-2xl transition-all transform hover:scale-[1.05] shadow-xl text-xl"
                >
                  <BookOpen className="w-6 h-6" />
                  Read The Complete Debt Freedom Guide
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="ad-container text-center my-4">
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-3037944530219260"
                     data-ad-slot="YOUR_AD_SLOT_ID_2_HERE"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-white/30">
              <Award className="w-20 h-20 text-white mx-auto mb-4" />
              <div className='flex justify-center items-center gap-4 mb-8'>
                <h3 className="text-4xl md:text-5xl font-black text-white">Ready to Take Control?</h3>
                <button onClick={() => setShowShareModal(true)} className="bg-white/20 hover:bg-white/30 text-white font-bold p-4 rounded-full transition-colors"><Share2 className="w-6 h-6" /></button>
              </div>
              <p className="text-2xl text-white/95 mb-8 max-w-2xl mx-auto">Download your personalized plan with all the numbers, tips, and action steps.</p>
              <button onClick={generatePDF} className="inline-flex items-center gap-3 bg-white text-green-600 hover:bg-gray-100 font-bold px-12 py-6 rounded-2xl transition-all transform hover:scale-[1.05] shadow-2xl text-2xl">
                <Download className="w-8 h-8" />
                Download My Freedom Plan (FREE)
              </button>
              <p className="text-white/80 text-lg mt-4">No email. No signup. Just your plan to freedom.</p>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-2">Made with ❤️ by <a href="https://secretsantamatch.com" className="text-purple-400 hover:text-purple-300 font-bold underline decoration-2 decoration-purple-400/50 hover:decoration-purple-300/50 transition">SecretSantaMatch.com</a></p>
              <p className="text-gray-500 text-base">Free Secret Santa generator • Beautiful cards • No email required</p>
            </div>
          </div>
        )}
      </div>

      {showBlogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between border-b-2 border-white/20 z-10">
              <h2 className="text-3xl font-black text-white flex items-center gap-3"><BookOpen className="w-8 h-8" />Complete Debt Freedom Guide</h2>
              <button onClick={() => setShowBlogModal(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 text-white space-y-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-3 text-yellow-300">🎯 Why Minimum Payments Keep You Trapped</h3>
                <p className="text-white/90 leading-relaxed text-lg">Credit card companies design minimum payments to maximize their profit. At typical 2% minimums, they ensure you stay in debt for decades while they collect interest. It's completely legal, but it's designed to work against you. The calculator shows you the real numbers they hope you never calculate.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-3 text-blue-300">💡 The Avalanche Method (Math Says This Is Best)</h3>
                <p className="text-white/90 leading-relaxed mb-3 text-lg">Attack your highest interest rate debt first while paying minimums on everything else. This mathematically saves you the most money.</p>
                <ul className="space-y-2 text-white/80 text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" /><span>List all debts from highest to lowest interest rate</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" /><span>Pay minimums on everything except the highest rate</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" /><span>Throw all extra money at the highest rate debt</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" /><span>When paid off, roll that payment to the next highest</span></li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-3 text-pink-300">🔥 The Snowball Method (Psychology Says This Works)</h3>
                <p className="text-white/90 leading-relaxed text-lg">Pay off your smallest balance first for quick wins. Not mathematically optimal, but the motivation from seeing debts disappear keeps people going. Sometimes psychology beats math!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-3 text-green-300">💰 Balance Transfer Strategy</h3>
                <p className="text-white/90 leading-relaxed text-lg">Move high-interest debt to a 0% APR promotional card. You get 12-18 months to pay down the balance without new interest piling up. Just don't add new debt and pay it off before the promo ends!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-3 text-purple-300">🎯 Real Success Stories</h3>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="font-bold mb-2 text-lg">Sarah, 32 - Paid off $15,000 in 18 months</p>
                    <p className="text-white/80 text-base">"I used the coffee savings tip and meal prepping. Added $200/month extra to my Chase card. Now I'm debt-free and saving for a down payment. This calculator was my wake-up call!"</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="font-bold mb-2 text-lg">Mike, 28 - Eliminated $8,000 in 10 months</p>
                    <p className="text-white/80 text-base">"Started a side hustle walking dogs on Rover. Combined with cutting subscriptions, I was paying an extra $300/month. Didn't realize how much years of minimum payments would cost me."</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-center">
                <h3 className="text-3xl font-black mb-4">Your Turn - Start Today!</h3>
                <p className="mb-6 text-xl">Every day you wait, more interest piles up</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => setShowBlogModal(false)} className="bg-white text-orange-600 font-bold px-10 py-4 rounded-xl hover:bg-gray-100 transition text-xl">
                      Go Back & Make Your Plan
                    </button>
                    <a href="/blog.html" className="bg-transparent border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/20 transition text-xl">
                      Explore More Resources
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowShareModal(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl max-w-md w-full p-8 border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Share This Tool</h2>
            <div className="flex justify-center gap-4">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors" aria-label="Share on Facebook"><Facebook size={32} /></a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Check out this free debt calculator!")}`} target="_blank" rel="noopener noreferrer" className="w-16 h-16 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-colors" aria-label="Share on Twitter"><Twitter size={32} /></a>
            </div>
            <div className="mt-6 relative">
              <input type="text" value={window.location.href} readOnly className="w-full bg-white/10 text-white p-3 rounded-lg pr-12 border border-white/20" />
              <button onClick={handleCopyLink} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full">
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-6 w-full bg-white/20 text-white py-2 rounded-lg hover:bg-white/30 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
