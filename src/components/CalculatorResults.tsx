import React, { useState, Dispatch, SetStateAction } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Flame, Award, Download, Share2, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { CalculatorResult } from '../types';

interface CalculatorResultsProps {
  results: CalculatorResult;
  customPayment: number;
  setCustomPayment: Dispatch<SetStateAction<number>>;
  setShowBlogModal: Dispatch<SetStateAction<boolean>>;
  setShowShareModal: Dispatch<SetStateAction<boolean>>;
}

// Re-define helpers here to make the component self-contained
const formatCurrency = (num: number) => {
    if (num === Infinity || isNaN(num)) return '∞';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num);
  };

const formatTime = (totalMonths: number) => {
    if (totalMonths === Infinity || isNaN(totalMonths) || totalMonths < 0) return 'Never';
    if (totalMonths === 0) return '0 months';
    const years = Math.floor(totalMonths / 12);
    const months = Math.round(totalMonths % 12);
    
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700">
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


const CalculatorResults: React.FC<CalculatorResultsProps> = ({ results, customPayment, setCustomPayment, setShowBlogModal, setShowShareModal }) => {
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    if (!results) return null;

    const generatePDF = async () => {
        setIsPdfLoading(true);
        const input = document.getElementById('results-section');
        if (input) {
            try {
                const canvas = await html2canvas(input, {
                    scale: 2, // Higher resolution
                    backgroundColor: '#111827', // Match dark background
                    useCORS: true,
                });

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

    return (
        <div id="results-section" className="space-y-8">
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-red-400/50">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-white/20 rounded-2xl p-4"><AlertTriangle className="w-12 h-12" /></div>
                    <div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4">If You Keep Paying Just {formatCurrency(results.totalMinPayment)}/Month...</h2>
                    <p className="text-xl md:text-2xl text-white/95">Here's the trap your bank sets for you:</p>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/30 grid md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-white/80 text-lg mb-2">YOU'LL BE DEBT-FREE IN...</p>
                        <p className="text-7xl md:text-9xl font-black tracking-tighter mb-3">{results.scenarios[0].debtFreeYear}</p>
                        <p className="text-2xl font-bold">That's <span className="text-yellow-300">{formatTime(results.scenarios[0].months)}</span> from now!</p>
                    </div>
                    <div>
                        <p className="text-white/80 text-lg mb-2">YOU'LL PAY THIS MUCH IN TOTAL...</p>
                        <p className="text-6xl md:text-8xl font-black text-yellow-300 mb-3">{formatCurrency(results.scenarios[0].totalPaid)}</p>
                        <p className="text-2xl">That's <span className="text-red-200 font-bold">{formatCurrency(results.scenarios[0].totalInterest)}</span> burned on interest!</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
              <div className="text-center mb-8"><h2 className="text-4xl font-black mb-3 flex items-center justify-center gap-3"><Zap className="w-10 h-10 text-yellow-400" /> Try It Yourself! Slide to See the Magic</h2><p className="text-xl text-gray-300">Move the slider to see how paying more changes everything</p></div>
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="mb-8"><label className="block text-2xl font-bold mb-4 text-center">Add Extra Payment: <span className="text-yellow-300">{formatCurrency(customPayment)}</span> per month</label><input type="range" min="0" max="500" step="10" value={customPayment} onChange={(e) => setCustomPayment(parseInt(e.target.value))} className="w-full h-4 bg-white/20 rounded-lg appearance-none cursor-pointer slider" /><div className="flex justify-between text-white/60 mt-2 text-lg"><span>$0</span><span>$250</span><span>$500</span></div></div>
                {customPayment > 0 && (
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8">
                    <h3 className="text-3xl font-bold mb-6 text-center">If You Pay {formatCurrency(results.customPaymentTotal)}/Month:</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white/20 rounded-xl p-6 text-center"><p className="text-white/80 text-lg mb-2">Debt-Free By</p><p className="text-6xl font-black text-yellow-300">{results.customYear}</p><p className="mt-2 text-lg">{formatTime(results.customResults.months)}</p></div>
                      <div className="bg-white/20 rounded-xl p-6 text-center"><p className="text-white/80 text-lg mb-2">You'll Save</p>{results.weightedAPR > 0 ? <p className="text-5xl font-black text-yellow-300">{formatCurrency(results.customInterestSaved)}</p> : <p className="text-lg font-bold text-yellow-200 mt-4">(No interest to save with 0% APR)</p>}<p className="text-white/90 mt-2">vs minimum!</p></div>
                      <div className="bg-white/20 rounded-xl p-6 text-center"><p className="text-white/80 text-lg mb-2">Debt-Free Sooner By</p><p className="text-5xl font-black">{formatTime(results.scenarios[0].months - results.customResults.months)}</p></div>
                    </div>
                    <p className="text-center text-xl mt-6 font-semibold">🎉 That's the power of paying a little more!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Flame className="w-8 h-8 text-orange-400" /> See The Difference: Money Borrowed vs. Interest Burned</h2><p className="text-xl text-gray-300 mb-8">This chart shows why minimum payments are a trap.</p>
              <div className="h-96 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={results.interestVsPrincipal} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" /><XAxis type="number" stroke="#ffffff80" tickFormatter={(value) => formatCurrency(value as number)} /><YAxis type="category" dataKey="name" stroke="#ffffff80" width={150} tick={{ fill: '#ffffff' }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" radius={[0, 8, 8, 0]}><Cell key="cell-0" fill={results.interestVsPrincipal[0].fill} /><Cell key="cell-1" fill={results.interestVsPrincipal[1].fill} /></Bar></BarChart></ResponsiveContainer></div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-white/30">
              <div className="text-center mb-10"><h2 className="text-4xl md:text-5xl font-black mb-4">💡 22 Proven Ways to Find Extra Money</h2><p className="text-2xl text-white/95 mb-3">Total potential: <span className="font-black text-yellow-300 text-3xl">{formatCurrency(results.moneySavingTips.reduce((sum: number, t: any) => sum + t.amount, 0))}/month!</span></p></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{results.moneySavingTips.map((tip: any, index: number) => {const Icon = tip.icon; return (<div key={index} className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-6 hover:bg-white/20 transition-all group"><div className="flex items-start gap-4 mb-4"><div className="bg-white/20 rounded-xl p-3"><Icon className="w-8 h-8" /></div><div className="flex-1"><h3 className="text-xl font-bold leading-tight">{tip.label}</h3><p className="text-3xl font-black text-yellow-300 mt-2">+{formatCurrency(tip.amount)}/mo</p></div></div><p className="text-white/90 text-base mb-3">{tip.description}</p></div>);})}</div>
              <div className="mt-10 text-center"><button onClick={() => setShowBlogModal(true)} className="inline-flex items-center gap-3 bg-white text-purple-600 hover:bg-gray-100 font-bold px-10 py-5 rounded-2xl transition-all transform hover:scale-[1.05] shadow-xl text-xl"><BookOpen className="w-6 h-6" /> Read The Complete Debt Freedom Guide <ArrowRight className="w-6 h-6" /></button></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-white/30"><Award className="w-20 h-20 mx-auto mb-4" /><h3 className="text-4xl font-black mb-4">Take Control</h3><p className="text-xl text-white/95 mb-8">Download your personalized plan.</p><button onClick={generatePDF} disabled={isPdfLoading} className="inline-flex items-center gap-3 bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-2xl transition-all shadow-xl text-xl disabled:opacity-50"><Download className="w-7 h-7" /> {isPdfLoading ? 'Generating...' : 'Download My Plan'}</button></div>
              <div className="bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-white/30"><Share2 className="w-20 h-20 mx-auto mb-4" /><h3 className="text-4xl font-black mb-4">Share This Tool</h3><p className="text-xl text-white/95 mb-8">Help a friend see the truth about their debt.</p><button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-3 bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-2xl transition-all shadow-xl text-xl"><Share2 className="w-7 h-7" /> Share Now</button></div>
            </div>
        </div>
    );
};

export default CalculatorResults;
