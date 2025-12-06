
import React from 'react';
import { ArrowRight, ShoppingBag, Shirt, Gift } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

interface GiftGuidesSectionProps {
    variant?: 'compact' | 'full';
    display?: 'all' | 'sweaters' | 'white-elephant';
}

const GiftGuidesSection: React.FC<GiftGuidesSectionProps> = ({ variant = 'full', display = 'all' }) => {
    
    const handleGuideClick = (guideName: string) => {
        trackEvent('affiliate_guide_click', { guide: guideName });
    };

    const WhiteElephantCard = (
        <a 
            href="/white-elephant-gifts-that-get-stolen.html" 
            target="_blank"
            onClick={() => handleGuideClick('white_elephant')}
            className={`group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col sm:flex-row ${display === 'white-elephant' ? 'max-w-2xl mx-auto' : ''}`}
        >
            <div className="bg-emerald-50 p-6 flex items-center justify-center sm:w-1/3 group-hover:bg-emerald-100 transition-colors relative">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🐘</div>
                {/* Decor */}
                <div className="absolute top-2 right-2 text-emerald-200"><Gift size={20} /></div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Most Popular</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
                    25 White Elephant Gifts That Actually Get Stolen
                </h3>
                <p className="text-sm text-slate-500 mb-4">Don't bring the boring gift. Shop the data-backed list of viral party hits.</p>
                <div className="mt-auto flex items-center text-sm font-bold text-emerald-600 gap-1 group-hover:gap-2 transition-all">
                    Shop Gift Ideas <ArrowRight size={16} />
                </div>
            </div>
        </a>
    );

    const UglySweaterCard = (
        <a 
            href="/ugly-christmas-sweaters.html" 
            target="_blank"
            onClick={() => handleGuideClick('ugly_sweaters')}
            className={`group relative overflow-hidden rounded-2xl border-2 border-red-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col sm:flex-row ${display === 'sweaters' ? 'max-w-2xl mx-auto border-red-200 ring-4 ring-red-50' : ''}`}
        >
            <div className="bg-red-50 p-6 flex items-center justify-center sm:w-1/3 group-hover:bg-red-100 transition-colors relative">
                <div className="relative">
                    <Shirt size={56} className="text-red-500 group-hover:text-red-600 transition-colors" strokeWidth={1.5} />
                    <div className="absolute -top-1 -right-2 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🎄</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 opacity-50"><ShoppingBag size={24} /></div>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Selling Fast</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New for 2025</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-red-700 transition-colors">
                    Best Ugly Christmas Sweaters & Jumpers
                </h3>
                <p className="text-sm text-slate-500 mb-4">LED light-ups, 3D designs & contest winners. Order now for 24h shipping.</p>
                <div className="mt-auto flex items-center text-sm font-bold text-red-600 gap-1 group-hover:gap-2 transition-all">
                    Shop Collection <ArrowRight size={16} />
                </div>
            </div>
        </a>
    );

    return (
        <section className={`w-full max-w-5xl mx-auto ${variant === 'compact' ? 'my-8' : 'my-12'} px-4`}>
            {variant === 'full' && display === 'all' && (
                <div className="flex items-center gap-3 mb-6 justify-center">
                    <ShoppingBag className="text-red-600" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Trending Holiday Deals</h2>
                </div>
            )}
            
            {display === 'all' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {WhiteElephantCard}
                    {UglySweaterCard}
                </div>
            ) : (
                <div className="w-full">
                    {display === 'sweaters' ? UglySweaterCard : WhiteElephantCard}
                </div>
            )}
        </section>
    );
};

export default GiftGuidesSection;
