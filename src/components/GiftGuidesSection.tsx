
import React from 'react';
import { ArrowRight, ShoppingBag, Shirt, Gift, Sparkles } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

interface GiftGuidesSectionProps {
    variant?: 'compact' | 'full';
    display?: 'all' | 'sweaters' | 'white-elephant' | 'skincare';
    source?: string;
}

const GiftGuidesSection: React.FC<GiftGuidesSectionProps> = ({ 
    variant = 'full', 
    display = 'all',
    source = 'unknown'
}) => {
    
    const handleGuideClick = (guideName: string) => {
        trackEvent('affiliate_guide_click', { 
            guide: guideName,
            source: source
        });
    };

    const WhiteElephantCard = (
        <a 
            href="/white-elephant-gifts-that-get-stolen.html" 
            target="_blank"
            onClick={() => handleGuideClick('white_elephant')}
            className={`group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${display === 'white-elephant' ? 'max-w-2xl mx-auto flex-col sm:flex-row' : ''}`}
        >
            <div className={`bg-emerald-50 p-6 flex items-center justify-center group-hover:bg-emerald-100 transition-colors relative ${display === 'white-elephant' ? 'sm:w-1/3' : 'h-48'}`}>
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🐘</div>
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
            className={`group relative overflow-hidden rounded-2xl border-2 border-red-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${display === 'sweaters' ? 'max-w-2xl mx-auto flex-col sm:flex-row border-red-200 ring-4 ring-red-50' : ''}`}
        >
            <div className={`bg-red-50 p-6 flex items-center justify-center group-hover:bg-red-100 transition-colors relative ${display === 'sweaters' ? 'sm:w-1/3' : 'h-48'}`}>
                <div className="relative">
                    <Shirt size={56} className="text-red-500 group-hover:text-red-600 transition-colors" strokeWidth={1.5} />
                    <div className="absolute -top-1 -right-2 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🎄</div>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Selling Fast</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-red-700 transition-colors">
                    Best Ugly Christmas Sweaters 2025
                </h3>
                <p className="text-sm text-slate-500 mb-4">LED light-ups & 3D designs. Order now for next-day delivery.</p>
                <div className="mt-auto flex items-center text-sm font-bold text-red-600 gap-1 group-hover:gap-2 transition-all">
                    Shop Collection <ArrowRight size={16} />
                </div>
            </div>
        </a>
    );

    const SkincareCard = (
        <a 
            href="/best-skincare-gifts.html" 
            target="_blank"
            onClick={() => handleGuideClick('skincare')}
            className={`group relative overflow-hidden rounded-2xl border-2 border-rose-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${display === 'skincare' ? 'max-w-2xl mx-auto flex-col sm:flex-row' : ''}`}
        >
            <div className={`bg-rose-50 p-6 flex items-center justify-center group-hover:bg-rose-100 transition-colors relative ${display === 'skincare' ? 'sm:w-1/3' : 'h-48'}`}>
                <div className="relative">
                    <Sparkles size={56} className="text-rose-400 group-hover:text-rose-500 transition-colors" strokeWidth={1.5} />
                    <div className="absolute -bottom-2 -right-2 text-2xl">✨</div>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Viral Hits</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-rose-600 transition-colors">
                    Best Viral Skincare Gifts 2025
                </h3>
                <p className="text-sm text-slate-500 mb-4">From Snail Mucin to Glass Skin tech. The products actually worth the hype.</p>
                <div className="mt-auto flex items-center text-sm font-bold text-rose-500 gap-1 group-hover:gap-2 transition-all">
                    See the List <ArrowRight size={16} />
                </div>
            </div>
        </a>
    );

    return (
        <section className={`w-full ${display === 'all' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto ${variant === 'compact' ? 'my-8' : 'my-12'} px-4`}>
            {variant === 'full' && display === 'all' && (
                <div className="flex items-center gap-3 mb-6 justify-center">
                    <ShoppingBag className="text-red-600" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Trending Holiday Deals</h2>
                </div>
            )}
            
            {display === 'all' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {WhiteElephantCard}
                    {UglySweaterCard}
                    {SkincareCard}
                </div>
            ) : (
                <div className="w-full">
                    {display === 'sweaters' && UglySweaterCard}
                    {display === 'white-elephant' && WhiteElephantCard}
                    {display === 'skincare' && SkincareCard}
                </div>
            )}
        </section>
    );
};

export default GiftGuidesSection;
