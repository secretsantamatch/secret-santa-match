
import React from 'react';
import type { Partner, AdCreative } from '../data/adConfig';
import { trackEvent } from '../services/analyticsService';
import { ArrowRight, ExternalLink, Gem, Clock, Star, ShieldCheck, Lock, CheckCircle, Globe, Heart, Gift } from 'lucide-react';

interface AdProps {
    partner: Partner;
    creative: AdCreative;
    placement: string;
}

const handleAdClick = (partnerName: string, placement: string, creativeId: string, creativeType: string) => {
    trackEvent('affiliate_click', { 
        partner: partnerName, 
        placement,
        creative_id: creativeId,
        creative_type: creativeType
    });
};

// 1. Luxury Card (Bonheur / Visa) - Gold/High-end feel
const LuxuryCard: React.FC<AdProps> = ({ partner, creative, placement }) => {
    const targetLink = creative.linkOverride || partner.affiliateLink;
    
    return (
    <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl hover:shadow-2xl transition-all my-6 animate-fade-in w-full max-w-md mx-auto flex flex-col">
        {/* CSS for Shimmer Effect */}
        <style>{`
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-shimmer {
                animation: shimmer 2.5s infinite;
            }
        `}</style>

        {/* Gold Top Bar */}
        <div className="relative h-1.5 w-full overflow-hidden bg-stone-100">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 animate-shimmer" style={{ width: '200%' }}></div>
        </div>

        {/* Image Section */}
        {creative.imageUrl && (
            <div className="relative bg-stone-50 w-full aspect-[4/3] flex items-center justify-center overflow-hidden p-6 border-b border-stone-100">
                <a 
                    href={targetLink} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored"
                    onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)}
                    className="block w-full h-full flex items-center justify-center relative z-10"
                >
                    <img 
                        src={creative.imageUrl} 
                        alt={creative.headline} 
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                        loading="lazy"
                    />
                </a>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Verified Badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-slate-900 border border-stone-200 text-[10px] font-bold px-3 py-1.5 rounded-sm tracking-widest uppercase z-20 shadow-sm flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-600" /> Verified Partner
                </div>
            </div>
        )}

        {/* Content Section */}
        <div className="p-6 text-center flex-grow flex flex-col">
            <div className="mb-1 flex justify-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Premium Selection</span>
            </div>
            <h4 className="font-serif text-2xl font-bold text-slate-900 mb-3 leading-tight">{creative.headline}</h4>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed px-2 font-light">{creative.body}</p>
            
            <div className="mt-auto flex justify-center">
                <a 
                    href={targetLink}
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-900 text-white px-8 py-4 rounded-sm hover:bg-slate-800 transition-all tracking-wide shadow-md w-full sm:w-auto hover:-translate-y-0.5 group-hover:shadow-lg"
                    onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)}
                >
                    {creative.cta} <ArrowRight size={16} />
                </a>
            </div>
        </div>

        {/* Trust Footer Strip */}
        <div className="bg-stone-100 border-t border-stone-200 py-2.5 px-4 flex items-center justify-center gap-6 text-[10px] text-stone-500 font-medium uppercase tracking-wider flex-wrap">
            <span className="flex items-center gap-1.5"><Lock size={10} /> Secure Checkout</span>
            {partner.geo === 'GLOBAL' && (
                <span className="flex items-center gap-1.5 text-stone-600"><Globe size={10} /> Ships Worldwide</span>
            )}
            <span className="flex items-center gap-1.5"><CheckCircle size={10} /> Official Retailer</span>
        </div>
    </div>
    );
};

// 2. Fun Card (Sugarwish) - Colorful/Pop/Dynamic
const FunCard: React.FC<AdProps> = ({ partner, creative, placement }) => {
    const targetLink = creative.linkOverride || partner.affiliateLink;
    const isFemaleFounded = partner.id === 'sugarwish'; // Specific badge for Sugarwish story

    return (
    <div className={`group relative overflow-hidden rounded-2xl border-2 shadow-lg animate-fade-in hover:shadow-xl transition-all transform hover:-translate-y-1 bg-gradient-to-br from-${creative.themeColor || 'pink'}-50 via-white to-${creative.themeColor || 'pink'}-50 border-${creative.themeColor || 'pink'}-200 my-6`}>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-50 -mr-10 -mt-10"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row">
            {/* Image Side (If Image Exists) */}
            {creative.imageUrl ? (
                <div className="sm:w-2/5 relative min-h-[180px] sm:min-h-full">
                    <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                         <a href={targetLink} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)} className="block w-full h-full">
                            <img 
                                src={creative.imageUrl} 
                                alt={creative.headline} 
                                className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500" 
                                loading="lazy"
                            />
                        </a>
                    </div>
                    {/* Badge Overlay */}
                    {isFemaleFounded && (
                        <div className="absolute bottom-2 left-2 bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-pink-200">
                            👩‍💼 Female Founded
                        </div>
                    )}
                </div>
            ) : (
                // Fallback Icon if no image
                <div className="p-6 flex items-center justify-center sm:w-auto">
                    <div className={`flex-shrink-0 bg-white rounded-full h-20 w-20 flex items-center justify-center shadow-md border-2 border-${creative.themeColor || 'pink'}-100`}>
                        <partner.icon size={36} className={`text-${creative.themeColor || 'pink'}-500`} />
                    </div>
                </div>
            )}

            {/* Content Side */}
            <div className={`p-6 flex flex-col justify-center ${creative.imageUrl ? 'sm:w-3/5 sm:border-l border-slate-100' : 'flex-grow'}`}>
                
                {!creative.imageUrl && isFemaleFounded && (
                     <div className="mb-3">
                        <span className="inline-block bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-1 rounded-full">👩‍💼 Female Founded</span>
                    </div>
                )}

                <h4 className={`font-black text-xl text-${creative.themeColor || 'pink'}-900 leading-tight mb-2 group-hover:text-${creative.themeColor || 'pink'}-700 transition-colors`}>
                    {creative.headline}
                </h4>
                
                <p className={`text-sm text-slate-600 font-medium leading-relaxed mb-5`}>
                    {creative.body}
                </p>
                
                <div className="mt-auto">
                    <a 
                        href={targetLink} 
                        target="_blank" 
                        rel="noopener noreferrer sponsored" 
                        className={`inline-flex items-center justify-center gap-2 text-sm font-bold bg-${creative.themeColor || 'pink'}-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-${creative.themeColor || 'pink'}-600 transition-all hover:shadow-lg w-full sm:w-auto transform active:scale-95`}
                        onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)}
                    >
                        <Gift size={16} /> {creative.cta}
                    </a>
                </div>
            </div>
        </div>
    </div>
    );
};

// 3. Urgency Banner (Black Friday/Dates)
const UrgencyBanner: React.FC<AdProps> = ({ partner, creative, placement }) => {
    const targetLink = creative.linkOverride || partner.affiliateLink;

    // Helper to map theme color to tailwind classes
    const getThemeClasses = (color: string) => {
        switch(color) {
            case 'violet': return { bg: 'bg-indigo-900', gradient: 'from-indigo-900 via-purple-900 to-indigo-950', badge: 'bg-fuchsia-500', btnText: 'text-indigo-900', highlight: 'border-white/20' };
            case 'red': return { bg: 'bg-red-900', gradient: 'from-red-900 via-rose-900 to-red-950', badge: 'bg-red-500', btnText: 'text-red-900', highlight: 'border-white/20' };
            case 'blue': return { bg: 'bg-blue-900', gradient: 'from-blue-900 via-slate-900 to-blue-950', badge: 'bg-sky-500', btnText: 'text-blue-900', highlight: 'border-white/20' };
            case 'emerald': return { bg: 'bg-emerald-900', gradient: 'from-emerald-900 via-green-900 to-teal-950', badge: 'bg-emerald-500', btnText: 'text-emerald-900', highlight: 'border-white/20' };
            default: return { bg: 'bg-slate-900', gradient: 'from-slate-800 to-slate-950', badge: 'bg-white text-slate-900', btnText: 'text-slate-900', highlight: 'border-white/20' };
        }
    };
    const theme = getThemeClasses(creative.themeColor || 'slate');

    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-xl my-6 animate-fade-in border border-white/10 ${theme.bg}`}>
            {/* Background Gradient & Effects */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} z-0`}></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 blur-3xl rounded-full z-0"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent z-0"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-stretch">
                {/* Visual Section */}
                <div className="sm:w-1/3 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-white/10 bg-black/10">
                    <div className={`absolute top-4 left-4 ${theme.badge} text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg z-20 flex items-center gap-1`}>
                        <Clock size={10} /> LIMITED TIME
                    </div>
                    
                    {creative.imageUrl ? (
                        <div className="w-full h-32 flex items-center justify-center mt-4">
                            <img src={creative.imageUrl} alt="Promo" className="max-w-full max-h-full object-contain drop-shadow-xl transform transition-transform hover:scale-105" />
                        </div>
                    ) : (
                        <div className="bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 shadow-inner mt-4">
                            <partner.icon size={48} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="sm:w-2/3 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-yellow-100 uppercase tracking-widest">Special Offer</span>
                    </div>
                    
                    <h4 className="font-black text-2xl text-white leading-tight tracking-tight mb-2">{creative.headline}</h4>
                    
                    <p className="text-sm text-slate-200 font-medium leading-relaxed mb-4">{creative.body}</p>
                    
                    {creative.couponCode && (
                        <div className="inline-flex items-center gap-2 bg-black/30 border border-white/20 rounded-lg px-3 py-1.5 mb-4 w-fit">
                            <span className="text-xs text-slate-300">Code:</span>
                            <span className="font-mono font-bold text-white tracking-wide">{creative.couponCode}</span>
                        </div>
                    )}

                    <a 
                        href={targetLink} 
                        target="_blank" 
                        rel="noopener noreferrer sponsored" 
                        onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)} 
                        className={`flex items-center justify-center gap-2 w-full bg-white ${theme.btnText} font-bold py-3.5 rounded-xl hover:bg-opacity-90 transition-all transform active:scale-95 shadow-lg text-sm`}
                    >
                        {creative.cta} <ArrowRight size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
};

// 4. Standard Card (PineTales, The Met)
const StandardCard: React.FC<AdProps> = ({ partner, creative, placement }) => {
    const targetLink = creative.linkOverride || partner.affiliateLink;

    return (
    <div className={`group relative overflow-hidden rounded-2xl border border-${creative.themeColor || 'slate'}-200 bg-gradient-to-r from-${creative.themeColor || 'slate'}-50 to-white shadow-md hover:shadow-xl transition-all my-6 animate-fade-in max-w-md mx-auto`}>
        <div className="flex flex-col sm:flex-row p-5 gap-5 items-center sm:items-start">
            {creative.imageUrl ? (
                <div className={`flex-shrink-0 w-full sm:w-28 h-48 sm:h-28 bg-white rounded-xl border border-${creative.themeColor || 'slate'}-100 overflow-hidden flex items-center justify-center shadow-sm`}>
                     <img src={creative.imageUrl} alt={creative.headline} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
            ) : (
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-${creative.themeColor || 'slate'}-100 text-${creative.themeColor || 'slate'}-600`}>
                    <partner.icon size={32} />
                </div>
            )}
            <div className="flex-grow text-center sm:text-left">
                <h4 className="font-serif font-bold text-xl text-slate-800 leading-tight mb-2">
                    {creative.headline}
                </h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    {creative.body}
                </p>
                <a
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`inline-flex items-center justify-center gap-1.5 text-sm font-bold bg-white text-${creative.themeColor || 'slate'}-700 px-5 py-2.5 rounded-lg border border-${creative.themeColor || 'slate'}-200 hover:bg-${creative.themeColor || 'slate'}-600 hover:text-white hover:border-${creative.themeColor || 'slate'}-600 transition-all shadow-sm w-full sm:w-auto`}
                    onClick={() => handleAdClick(partner.name, placement, creative.id, creative.type)}
                >
                    {creative.cta} <ArrowRight size={14} />
                </a>
            </div>
        </div>
    </div>
    );
};

// MAIN EXPORT
export const SmartAd: React.FC<AdProps> = (props) => {
    switch (props.creative.type) {
        case 'luxury': return <LuxuryCard {...props} />;
        case 'fun': return <FunCard {...props} />;
        case 'urgency': return <UrgencyBanner {...props} />;
        default: return <StandardCard {...props} />;
    }
};
