import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Gift, ShoppingCart, Utensils, Plane, Heart, Plus, Trash2, TrendingUp, AlertTriangle, Download, Share2, Printer, Bookmark, Twitter, Facebook, Copy, BookOpen, ArrowRight, X } from 'lucide-react';

// Interfaces for our state
interface Exchange {
  id: number;
  name: string;
  budget: string;
  shipping: string;
}

const HolidayBudgetCalculator: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([{ id: 1, name: 'Office Secret Santa', budget: '25', shipping: '0' }]);
  const [otherSpending, setOtherSpending] = useState({ family: '300', hosting: '0', extras: '0' });
  const [creditInfo, setCreditInfo] = useState({ utilization: '', limit: '', balance: '' });
  const [resultsVisible, setResultsVisible] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Effect to run AdSense push after component mounts and results are shown
  useEffect(() => {
    if (resultsVisible) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [resultsVisible]);

  const addExchange = () => {
    const newId = exchanges.length > 0 ? Math.max(...exchanges.map(e => e.id)) + 1 : 1;
    setExchanges([...exchanges, { id: newId, name: `Exchange #${newId}`, budget: '', shipping: '0' }]);
  };

  const removeExchange = (id: number) => {
    if (exchanges.length > 1) {
      setExchanges(exchanges.filter(e => e.id !== id));
    }
  };

  const updateExchange = (id: number, field: keyof Omit<Exchange, 'id'>, value: string) => {
    setExchanges(exchanges.map(e => e.id === id ? { ...e, [field]: value } : e));
    setResultsVisible(true);
  };
  
  const handleOtherSpendingChange = (field: keyof typeof otherSpending, value: string) => {
    setOtherSpending(prev => ({...prev, [field]: value}));
    setResultsVisible(true);
  };
  
  const handleCreditInfoChange = (field: keyof typeof creditInfo, value: string) => {
    setCreditInfo(prev => ({...prev, [field]: value}));
    setResultsVisible(true);
  };
  
  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

  const results = useMemo(() => {
    const exchangeTotal = exchanges.reduce((sum, ex) => sum + (parseFloat(ex.budget) || 0) + (parseFloat(ex.shipping) || 0), 0);
    const otherTotal = (parseFloat(otherSpending.family) || 0) + (parseFloat(otherSpending.hosting) || 0) + (parseFloat(otherSpending.extras) || 0);
    const grandTotal = exchangeTotal + otherTotal;

    const pieData = [
      { name: 'Exchanges', value: exchangeTotal, color: '#667eea' },
      { name: 'Family/Friends', value: parseFloat(otherSpending.family) || 0, color: '#764ba2' },
      { name: 'Hosting/Parties', value: parseFloat(otherSpending.hosting) || 0, color: '#f093fb' },
      { name: 'Decor/Extras', value: parseFloat(otherSpending.extras) || 0, color: '#f5576c' },
    ].filter(d => d.value > 0);

    const creditLimit = parseFloat(creditInfo.limit) || 0;
    const currentBalance = parseFloat(creditInfo.balance) || 0;
    const currentUtil = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
    const newBalance = currentBalance + grandTotal;
    const newUtil = creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0;
    let scoreImpact = 0;
    if (newUtil > 70) scoreImpact = -80;
    else if (newUtil > 50) scoreImpact = -50;
    else if (newUtil > 30) scoreImpact = -20;

    const avgSpending = 920;
    const comparisonData = [
        { name: 'You', value: grandTotal, fill: grandTotal > avgSpending ? '#ef4444' : '#10b981' },
        { name: 'Avg. American', value: avgSpending, fill: '#fbbf24' },
        { name: 'Debt-Free Target', value: 300, fill: '#10b981' }
    ];

    return { grandTotal, exchangeTotal, otherTotal, pieData, currentUtil, newUtil, scoreImpact, comparisonData };
  }, [exchanges, otherSpending, creditInfo]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav & Hero */}
      <div className="nav-bar bg-slate-900/80">
        <div className="nav-content max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="nav-logo text-xl font-bold text-purple-400">SecretSantaMatch.com</a>
          <a href="/blog.html" className="nav-link text-purple-300 hover:text-white">Blog</a>
        </div>
      </div>
      <div className="hero bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
        <div className="hero-content max-w-4xl mx-auto py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4">Holiday Spending Reality Check</h1>
          <p className="hero-subtitle text-xl md:text-2xl text-slate-300">Calculate your real holiday costs + credit impact in 3 minutes</p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto -mt-20 px-4">
        {/* Live Total */}
        <div className="live-total bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg mb-8">
            <div className="live-total-label">Your Total Holiday Spending</div>
            <div className="live-total-amount">{formatCurrency(results.grandTotal)}</div>
            <div className="live-total-breakdown">{results.grandTotal > 0 ? `${exchanges.length} exchanges (${formatCurrency(results.exchangeTotal)}) + Other (${formatCurrency(results.otherTotal)})` : 'Start adding expenses below'}</div>
        </div>
        
        {/* Calculator Inputs */}
        <div className="space-y-8">
            <div className="card bg-slate-800 border-slate-700">
                <div className="section-header">
                    <Gift className="w-10 h-10 mr-4 text-purple-400"/>
                    <div>
                        <h2 className="section-title text-2xl">Gift Exchanges & Secret Santas</h2>
                        <p className="section-subtitle">Add every exchange you're in — work, friends, family, etc.</p>
                    </div>
                </div>
                <div id="exchanges-container">
                    {exchanges.map(ex => (
                        <div key={ex.id} className="exchange-card bg-slate-900 border-slate-700">
                            <span className="exchange-number bg-purple-500">Exchange {ex.id}</span>
                            {exchanges.length > 1 && <button className="remove-btn bg-red-600 hover:bg-red-700" onClick={() => removeExchange(ex.id)}>Remove</button>}
                            <div className="input-grid mt-4">
                                <div className="input-group"><label>Exchange Name</label><input type="text" value={ex.name} onChange={e => updateExchange(ex.id, 'name', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500" /></div>
                                <div className="input-group"><label>Gift Budget ($)</label><input type="number" value={ex.budget} onChange={e => updateExchange(ex.id, 'budget', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500" /></div>
                                <div className="input-group"><label>Shipping & Tax</label><select value={ex.shipping} onChange={e => updateExchange(ex.id, 'shipping', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500"><option value="0">In person (no cost)</option><option value="8">Standard shipping (~$8)</option><option value="15">International (~$15)</option></select></div>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="add-btn bg-gradient-to-r from-purple-600 to-indigo-600" onClick={addExchange}><Plus/> Add Another Exchange</button>
            </div>
            
            <div className="card bg-slate-800 border-slate-700">
                <div className="section-header"><ShoppingCart className="w-10 h-10 mr-4 text-purple-400"/><div><h2 className="section-title text-2xl">Other Holiday Spending</h2><p className="section-subtitle">Gifts for close family, parties, decorations, etc.</p></div></div>
                <div className="input-grid">
                    <div className="input-group"><label>Close Family & Friends Gifts</label><input type="number" value={otherSpending.family} onChange={e => handleOtherSpendingChange('family', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500" /></div>
                    <div className="input-group"><label>Parties & Hosting</label><input type="number" value={otherSpending.hosting} onChange={e => handleOtherSpendingChange('hosting', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500" /></div>
                    <div className="input-group"><label>Decorations & Extras</label><input type="number" value={otherSpending.extras} onChange={e => handleOtherSpendingChange('extras', e.target.value)} className="bg-slate-950 border-slate-600 focus:border-purple-500" /></div>
                </div>
            </div>

            <div className="card bg-slate-800 border-slate-700">
                <div className="section-header"><TrendingUp className="w-10 h-10 mr-4 text-purple-400"/><div><h2 className="section-title text-2xl">Credit Health Check</h2><p className="section-subtitle">See how holiday spending will impact your credit score.</p></div></div>
                <div className="input-grid">
                    <div className="input-group"><label>Total Credit Limits</label><input type="number" value={creditInfo.limit} onChange={e => handleCreditInfoChange('limit', e.target.value)} placeholder="e.g., 10000" className="bg-slate-950 border-slate-600 focus:border-purple-500"/></div>
                    <div className="input-group"><label>Current Card Balances</label><input type="number" value={creditInfo.balance} onChange={e => handleCreditInfoChange('balance', e.target.value)} placeholder="e.g., 2000" className="bg-slate-950 border-slate-600 focus:border-purple-500"/></div>
                </div>
                <div className="insight-card bg-slate-900 border-l-purple-500 mt-6"><div className="insight-title text-purple-300"><span>💡</span> Don't Know These Numbers?</div><p className="text-slate-300">A free tool like Credit Karma shows all your cards in one place, calculates utilization for you, and monitors your score.</p></div>
            </div>
        </div>

        {/* Results Section */}
        {resultsVisible && results.grandTotal > 0 && (
          <div className="mt-12 space-y-8 fade-in">
            <div className="card bg-slate-800 border-slate-700">
              <h2 className="section-title text-center text-3xl mb-8">Your Spending Breakdown</h2>
              <div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >{results.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
            </div>

            <div className="card bg-slate-800 border-slate-700">
              <h2 className="section-title text-center text-3xl mb-8">How You Compare</h2>
              <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={results.comparisonData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><XAxis dataKey="name" stroke="#94a3b8"/><YAxis stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value as number)}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/><Bar dataKey="value" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>

            {creditInfo.limit && (
              <div className="card bg-slate-800 border-slate-700">
                <h2 className="section-title text-center text-3xl mb-8">Credit Score Impact Analysis</h2>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center"><div className="text-7xl font-black" style={{color: results.newUtil > 30 ? (results.newUtil > 50 ? '#ef4444' : '#f59e0b') : '#10b981' }}>{results.newUtil.toFixed(0)}%</div><div className="text-xl text-slate-400">New Credit Utilization</div></div>
                    <div>
                        <div className={`insight-card ${results.scoreImpact < 0 ? 'danger' : ''}`}>
                            <div className="insight-title"><AlertTriangle className="text-red-400"/>Your Score Is At Risk</div>
                            <p className="text-slate-300">Adding {formatCurrency(results.grandTotal)} to your balances will push utilization to {results.newUtil.toFixed(0)}%. This could drop your score by <span className="font-bold text-white">{Math.abs(results.scoreImpact)}</span> points.</p>
                        </div>
                        <div className="mt-4 text-center">
                            <a href="/minimum-payment-calculator.html" target="_blank" className="font-bold text-purple-400 hover:text-purple-300">Use our Minimum Payment Calculator to see the interest cost →</a>
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            <div className="action-buttons justify-center">
                <button className="action-btn" onClick={() => setShowPrintModal(true)}><Printer/> Print My Budget</button>
                <button className="action-btn" onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => alert('Link copied! Share it with friends.'));
                }}><Share2/> Share This Tool</button>
            </div>
          </div>
        )}
      </div>

      {showPrintModal && (
        <div className="modal-overlay" style={{display: 'flex'}} onClick={() => setShowPrintModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Print / Save Your Budget</h2></div>
            <div className="modal-body">
              <p>This will open your browser's print dialog. From there, you can either print to a physical printer or save your plan as a PDF file.</p>
              <p className="mt-4"><strong>To Save as PDF:</strong> In the print dialog, look for the 'Destination' or 'Printer' dropdown and select 'Save as PDF'.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => { window.print(); setShowPrintModal(false); }}>Print Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayBudgetCalculator;
