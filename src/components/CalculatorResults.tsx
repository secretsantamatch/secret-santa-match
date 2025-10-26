import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Flame, Award, Download, Share2, BookOpen, ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { CalculatorResult, Debt, PayoffResult } from '../types';

interface CalculatorResultsProps {
  debts: Debt[];
  results: CalculatorResult;
  customPayment: number;
  setCustomPayment: Dispatch<SetStateAction<number>>;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};

const formatCurrency = (num: number) => {
    if (num === Infinity || isNaN(num)) return '∞';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const formatTime = (totalMonths: number) => {
    if (totalMonths === Infinity || isNaN(totalMonths) || totalMonths < 0) return 'Never';
    if (totalMonths <= 0) return 'Instantly!';
    const years = Math.floor(totalMonths / 12);
    const months = Math.round(totalMonths % 12);
    
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 text-white p-3 rounded-lg shadow-xl border border-slate-500">
          <p className="font-semibold">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
};

const CalculatorResults: React.FC<CalculatorResultsProps> = ({ debts, results, customPayment, setCustomPayment }) => {
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [dynamicCustomResults, setDynamicCustomResults] = useState<PayoffResult>(results.customResults);
    const [dynamicInterestSaved, setDynamicInterestSaved] = useState<number>(results.customInterestSaved);

    useEffect(() => {
        const calculateMinimumPayment = (balance: number, percent: number, flat: number) => {
            return Math.max(flat, balance * (percent / 100));
        };

        const calculatePayoff = (extraPayment: number): PayoffResult => {
            let localDebts: (Debt & { balance: number })[] = JSON.parse(JSON.stringify(debts.filter(d => d.balance > 0)));
            let months = 0;
            let totalInterest = 0;
            const initialPrincipal = localDebts.reduce((sum, d) => sum + d.balance, 0);

            while (localDebts.reduce((sum, d) => sum + d.balance, 0) > 0) {
                months++;
                if (months > 1200) return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
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
                localDebts.sort((a, b) => b.apr - a.apr);
                const nextTempDebts: (Debt & { balance: number })[] = [];
                for (let debt of localDebts) {
                    if (paymentRemaining <= 0) { nextTempDebts.push(debt); continue; }
                    const payment = Math.min(debt.balance, paymentRemaining);
                    debt.balance -= payment;
                    paymentRemaining -= payment;
                    if (debt.balance > 0.01) { nextTempDebts.push(debt); }
                }
                localDebts = nextTempDebts;
            }
            return { months, totalInterest, totalPaid: initialPrincipal + totalInterest };
        };
        
        const handler = setTimeout(() => {
            const newCustomResults = calculatePayoff(customPayment);
            setDynamicCustomResults(newCustomResults);
            setDynamicInterestSaved(results.scenarios[0].totalInterest - newCustomResults.totalInterest);
        }, 100); // Debounce calculation

        return () => clearTimeout(handler);

    }, [customPayment, debts, results.scenarios]);

    if (!results) return null;

    const generatePDF = async () => {
        trackEvent('export_results', { type: 'pdf' });
        setIsPdfLoading(true);
        const input = document.getElementById('results-section-for-pdf');
        if (input) {
            try {
                const canvas = await html2canvas(input, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save("My_Debt_Freedom_Plan.pdf");
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Sorry, we couldn't generate the PDF. Please try again.");
            }
        }
        setIsPdfLoading(false);
    };
    
    const handleAffiliateClick = () => {
        trackEvent('affiliate_click', {
            affiliate_name: 'Credit Karma',
            placement: 'calculator_results'
        });
    };

    return (
        <div id="results-section-for-pdf" className="space-y-8 mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Your Debt Freedom Plan</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-6 text-center">
                    <h3 className="font-bold text-red-800 text-lg">With Minimum Payments</h3>
                    <p className="text-5xl font-bold text-red-600 my-2">{formatTime(results.scenarios[0].months)}</p>
                    <p className="text-slate-600">You'll pay <strong className="text-red-700">{formatCurrency(results.scenarios[0].totalInterest)}</strong> in interest.</p>
                </div>
                <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-2xl p-6 text-center">
                    <h3 className="font-bold text-green-800 text-lg">With Your Extra <span className="text-green-600">{formatCurrency(customPayment)}/mo</span></h3>
                    <p className="text-5xl font-bold text-green-600 my-2">{formatTime(dynamicCustomResults.months)}</p>
                    <p className="text-slate-600">You'll save <strong className="text-green-700">{formatCurrency(dynamicInterestSaved)}</strong> in interest!</p>
                </div>
            </div>

            <div>
                <label htmlFor="extra-payment-slider" className="block text-center text-lg font-bold mb-4 text-slate-700">How fast can you be debt-free? Slide to find out!</label>
                <input id="extra-payment-slider" type="range" min="0" max="1000" step="10" value={customPayment} onChange={(e) => setCustomPayment(parseInt(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                <div className="flex justify-between text-slate-500 mt-2 text-sm"><span>$0</span><span>$500</span><span>$1000</span></div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-4">Understanding the True Cost of Debt</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.interestVsPrincipal} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value as number)} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} tick={{ fill: '#475569' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                <Cell key="cell-0" fill={results.interestVsPrincipal[0].fill} />
                                <Cell key="cell-1" fill={results.interestVsPrincipal[1].fill} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 text-center">
                <h3 className="text-2xl font-bold text-indigo-800 font-serif mb-2">Your Next Step: Take Control</h3>
                <p className="text-indigo-700 max-w-xl mx-auto mb-6">High interest rates slowing you down? See if you can lower your APR, consolidate debt, or find a better card. It's free and won't hurt your score.</p>
                <div className="max-w-[300px] mx-auto" onClick={handleAffiliateClick} dangerouslySetInnerHTML={{ __html: `
                    <!-- START ADVERTISER: Credit Karma (US) from awin.com -->
                    <a rel="sponsored" href="https://www.awin1.com/cread.php?s=3597059&v=66532&q=475588&r=2612068" target="_blank">
                        <img src="https://www.awin1.com/cshow.php?s=3597059&v=66532&q=475588&r=2612068" border="0">
                    </a>
                    <!-- END ADVERTISER: Credit Karma (US) from awin.com -->
                `}} />
            </div>

            <div className="bg-sky-50 rounded-2xl p-6 md:p-8">
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-6 flex items-center justify-center gap-3"><Lightbulb className="w-7 h-7 text-sky-500"/>Find Extra Cash to Pay Down Debt Faster</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {results.moneySavingTips.map(tip => (
                        <div key={tip.label} className="flex items-start gap-4 bg-white p-4 rounded-lg border">
                            <tip.icon className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-slate-700">{tip.label} - Save ~{formatCurrency(tip.amount)}/mo</p>
                                <p className="text-sm text-slate-500">{tip.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-slate-100 rounded-2xl p-6 text-center">
                <h3 className="text-2xl font-bold text-slate-800 font-serif mb-2">Plan Your Holiday Spending</h3>
                <p className="text-slate-600 max-w-xl mx-auto mb-6">Worried about holiday debt? Use our free Holiday Budget Calculator to plan your spending and see its impact on your credit before you shop.</p>
                <a href="/holiday-budget-calculator.html" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Try the Holiday Budget Calculator <ArrowRight size={20} />
                </a>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={generatePDF} disabled={isPdfLoading} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50">
                    <Download size={20} /> {isPdfLoading ? 'Generating PDF...' : 'Download My Plan'}
                </button>
            </div>
        </div>
    );
};

export default CalculatorResults;
