
import React from 'react';
import type { Partner, AdCreative } from '../data/adConfig';
import { trackEvent } from '../services/analyticsService';
import { ArrowRight, ExternalLink, Gem } from 'lucide-react';

interface AdProps {
    partner: Partner;
    creative: AdCreative;
    placement: string;
}

const handleAdClick = (partnerName: string, placement: string) => {
    trackEvent('affiliate_click', { partner: partnerName, placement });
};

// 1. Luxury Card (Bonheur / Visa) - Gold/High-end feel
const LuxuryCard: React.FC<AdProps> = ({ partner, creative, placement }) => (
    <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg hover:shadow-2xl transition-all my-6 animate-fade-in max-w-md mx-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 z-10"></div>
        <div className="flex flex-col">
            {creative.imageUrl && (
                <div className="relative bg-stone-50 w-full aspect-square flex items-center justify-center overflow-hidden p-4">
                    <a 
                        href={partner.affiliateLink} 
                        target="_blank" 
                        rel="noopener noreferrer sponsored"
                        onClick={() => handleAdClick(partner.name, placement)}
                        className="block w-full h-full flex items-center justify-center"
                    >
                        <img 
                            src={creative.imageUrl} 
                            alt={creative.headline} 
                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                            loading="lazy"
                        />
                    </a>
                    <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase z-20 shadow-sm">
                        Verified Partner
                    </div>
                </div>
            )}
            <div className="p-6 text-center border-t border-stone-100">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Gem size={16} className="text-amber-500" />
                    <span className="text-xs font-bold tracking-widest uppercase text-amber-600">Premium Selection</span>
                </div>
                <h4 className="font-serif text-2xl font-bold text-slate-900 mb-3">{creative.headline}</h4>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">{creative.body}</p>
                <div className="flex justify-center">
                    <a 
                        href={partner.affiliateLink}
                        target="_blank" 
                        rel="noopener noreferrer sponsored" 
                        className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-900 text-white px-8 py-3 rounded-sm hover:bg-slate-800 transition-all tracking-wide shadow-md w-full"
                        onClick={() => handleAdClick(partner.name, placement)}
                    >
                        {creative.cta} <ArrowRight size={14} />
                    </a>
                </div>
            </div>
        </div>
    </div>
);

// 2. Fun Card (Sugarwish) - Colorful/Pop
const FunCard: React.FC<AdProps> = ({ partner, creative, placement }) => (
    <div className={`p-5 rounded-2xl border-2 shadow-md animate-fade-in hover:shadow-lg transition-all transform hover:-translate-y-0.5 bg-gradient-to-r from-${creative.themeColor || 'pink'}-50 to-white border-${creative.themeColor || 'pink'}-200`}>
        <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm border border-${creative.themeColor || 'pink'}-100`}>
                <partner.icon size={28} className={`text-${creative.themeColor || 'pink'}-500`} />
            </div>
            <div className="flex-grow">
                <h4 className={`font-extrabold text-lg text-${creative.themeColor || 'pink'}-900`}>{creative.headline}</h4>
                <p className={`text-sm text-${creative.themeColor || 'pink'}-800 font-medium opacity-90 mt-1`}>{creative.body}</p>
                <a 
                    href={partner.affiliateLink} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold bg-white px-5 py-2.5 rounded-xl border border-${creative.themeColor || 'pink'}-200 text-${creative.themeColor || 'pink'}-600 hover:bg-${creative.themeColor || 'pink'}-50 transition-colors shadow-sm`}
                    onClick={() => handleAdClick(partner.name, placement)}
                >
                    {creative.cta} <ExternalLink size={14} />
                </a>
            </div>
        </div>
    </div>
);

// 3. Urgency Banner (Black Friday/Dates)
const UrgencyBanner: React.FC<AdProps> = ({ partner, creative, placement }) => {
    // Helper to map theme color to tailwind classes since dynamic string interpolation can be tricky with JIT
    const getThemeClasses = (color: string) => {
        switch(color) {
            case 'violet': return { bg: 'from-indigo-900 via-violet-900 to-purple-900', badge: 'bg-violet-500', btnText: 'text-indigo-900' };
            case 'red': return { bg: 'from-slate-900 via-red-900 to-slate-900', badge: 'bg-red-600', btnText: 'text-red-900' };
            case 'blue': return { bg: 'from-blue-900 via-slate-800 to-blue-950', badge: 'bg-blue-500', btnText: 'text-blue-900' };
            default: return { bg: 'from-slate-900 via-slate-800 to-slate-900', badge: 'bg-red-600', btnText: 'text-slate-900' };
        }
    };
    const theme = getThemeClasses(creative.themeColor || 'slate');

    return (
        <div className={`bg-gradient-to-br ${theme.bg} text-white p-5 rounded-xl shadow-xl border border-white/10 relative overflow-hidden group my-6 animate-fade-in`}>
            <div className={`absolute top-0 right-0 ${theme.badge} text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-lg z-10`}>
                ENDING SOON
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
                {/* If we have a specific banner image, show it small, otherwise show icon */}
                {creative.imageUrl ? (
                    <div className="hidden sm:block w-24 h-16 bg-white rounded-lg p-1 overflow-hidden flex-shrink-0">
                        <img src={creative.imageUrl} alt="Promo" className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/20 flex-shrink-0">
                        <partner.icon size={32} className="text-white" />
                    </div>
                )}

                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`${theme.badge} text-white text-[10px] font-black px-2 py-0.5 rounded animate-pulse shadow-sm`}>LIMITED TIME</span>
                    </div>
                    <h4 className="font-black text-xl leading-tight tracking-tight">{creative.headline}</h4>
                    {creative.couponCode && (
                        <p className="text-xs text-white/90 mt-1 font-medium">Use Code: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-white font-bold border border-white/30">{creative.couponCode}</span></p>
                    )}
                    <p className="text-[11px] text-slate-300 mt-1 italic leading-snug">{creative.body}</p>
                </div>
            </div>
            <a 
                href={partner.affiliateLink} 
                target="_blank" 
                rel="noopener noreferrer sponsored" 
                onClick={() => handleAdClick(partner.name, placement)} 
                className={`mt-4 flex items-center justify-center w-full bg-white ${theme.btnText} font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all transform group-hover:scale-[1.02] shadow-lg text-sm`}
            >
                {creative.cta} <ArrowRight size={16} className="ml-2" />
            </a>
        </div>
    );
};

// 4. Standard Card (PineTales, The Met)
const StandardCard: React.FC<AdProps> = ({ partner, creative, placement }) => (
    <div className={`group relative overflow-hidden rounded-xl border border-${creative.themeColor || 'slate'}-200 bg-gradient-to-r from-${creative.themeColor || 'slate'}-50 to-white shadow-md hover:shadow-xl transition-all my-6 animate-fade-in max-w-md mx-auto`}>
        <div className="flex p-5 items-start gap-5">
            {creative.imageUrl ? (
                <div className={`flex-shrink-0 w-28 h-28 bg-white rounded-lg border border-${creative.themeColor || 'slate'}-100 overflow-hidden flex items-center justify-center shadow-sm`}>
                     <img src={creative.imageUrl} alt={creative.headline} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
            ) : (
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-${creative.themeColor || 'slate'}-100 text-${creative.themeColor || 'slate'}-600`}>
                    <partner.icon size={32} />
                </div>
            )}
            <div className="flex-grow">
                <h4 className="font-serif font-bold text-lg text-slate-800 leading-tight mb-2">
                    {creative.headline}
                </h4>
                <p className="text-sm text-slate-600 mb-3 leading-snug">
                    {creative.body}
                </p>
                <a
                    href={partner.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`inline-flex items-center gap-1.5 text-sm font-bold bg-white text-${creative.themeColor || 'slate'}-700 px-4 py-2 rounded-lg border border-${creative.themeColor || 'slate'}-200 hover:bg-${creative.themeColor || 'slate'}-600 hover:text-white hover:border-${creative.themeColor || 'slate'}-600 transition-all shadow-sm`}
                    onClick={() => handleAdClick(partner.name, placement)}
                >
                    {creative.cta} <ArrowRight size={14} />
                </a>
            </div>
        </div>
    </div>
);

// MAIN EXPORT
export const SmartAd: React.FC<AdProps> = (props) => {
    switch (props.creative.type) {
        case 'luxury': return <LuxuryCard {...props} />;
        case 'fun': return <FunCard {...props} />;
        case 'urgency': return <UrgencyBanner {...props} />;
        default: return <StandardCard {...props} />;
    }
};
