
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
            className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ring-1 ring-slate-100 ${display === 'white-elephant' ? 'max-w-2xl mx-auto flex-col sm:flex-row' : ''}`}
        >
            <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-400 to-cyan-500 p-8 flex items-center justify-center ${display === 'white-elephant' ? 'sm:w-5/12' : 'h-52'}`}>
                {/* Decorative Blobs */}
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-teal-900/10 blur-2xl"></div>
                
                {/* Icon */}
                <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <span className="text-7xl drop-shadow-lg filter">🐘</span>
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                    <Gift size={12} className="text-white" /> Popular
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center p-6">
                <h3 className="font-serif text-2xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                    25 White Elephant Gifts That Actually Get Stolen
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                    Don't bring the boring gift. Shop the data-backed list of viral party hits.
                </p>
                <div className="mt-auto flex items-center text-sm font-bold text-emerald-600 gap-2 group-hover:gap-3 transition-all uppercase tracking-wider">
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
            className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ring-1 ring-slate-100 ${display === 'sweaters' ? 'max-w-2xl mx-auto flex-col sm:flex-row border-red-200 ring-4 ring-red-50' : ''}`}
        >
            <div className={`relative overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 p-8 flex items-center justify-center ${display === 'sweaters' ? 'sm:w-5/12' : 'h-52'}`}>
                {/* Decorative Blobs */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-300/30 blur-3xl mix-blend-overlay transition-transform duration-700 group-hover:translate-y-4"></div>
                <div className="absolute bottom-4 left-4 h-20 w-20 rounded-full bg-red-900/10 blur-xl"></div>

                {/* Icon */}
                <div className="relative z-10">
                    <Shirt size={64} className="text-white drop-shadow-md transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" strokeWidth={1.5} />
                    <div className="absolute -top-2 -right-4 text-3xl animate-bounce drop-shadow-md" style={{ animationDuration: '2s' }}>🎄</div>
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Selling Fast
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center p-6">
                <h3 className="font-serif text-2xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-red-600 transition-colors">
                    Best Ugly Christmas Sweaters 2025
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                    LED light-ups & 3D designs. Order now for next-day delivery.
                </p>
                <div className="mt-auto flex items-center text-sm font-bold text-red-600 gap-2 group-hover:gap-3 transition-all uppercase tracking-wider">
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
            className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ring-1 ring-slate-100 ${display === 'skincare' ? 'max-w-2xl mx-auto flex-col sm:flex-row' : ''}`}
        >
            <div className={`relative overflow-hidden bg-gradient-to-br from-fuchsia-500 to-rose-400 p-8 flex items-center justify-center ${display === 'skincare' ? 'sm:w-5/12' : 'h-52'}`}>
                {/* Decorative Blobs */}
                <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-60"></div>
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-900/10 blur-2xl"></div>

                {/* Icon */}
                <div className="relative z-10 text-center">
                    <Sparkles size={64} className="text-white drop-shadow-md transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" strokeWidth={1.5} />
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Viral Hits
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center p-6">
                <h3 className="font-serif text-2xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-rose-500 transition-colors">
                    Best Viral Skincare Gifts 2025
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                    From Snail Mucin to Glass Skin tech. The products actually worth the hype.
                </p>
                <div className="mt-auto flex items-center text-sm font-bold text-rose-500 gap-2 group-hover:gap-3 transition-all uppercase tracking-wider">
                    See the List <ArrowRight size={16} />
                </div>
            </div>
        </a>
    );

    return (
        <section className={`w-full ${display === 'all' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto ${variant === 'compact' ? 'my-8' : 'my-16'} px-4`}>
            {variant === 'full' && display === 'all' && (
                <div className="flex flex-col items-center gap-3 mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-bold text-red-600 ring-1 ring-red-100">
                        <ShoppingBag size={14} /> Gift Guides
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 font-serif">Trending Holiday Deals</h2>
                </div>
            )}
            
            {display === 'all' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
